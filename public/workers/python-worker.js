// PlacePrep Portal - WebAssembly Python Execution Worker (Pyodide)
/* eslint-disable no-restricted-globals */

let pyodide = null;
let pyodideLoadingPromise = null;

async function initPyodide() {
  if (pyodide) return pyodide;
  if (!pyodideLoadingPromise) {
    pyodideLoadingPromise = (async () => {
      importScripts("https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js");
      // @ts-expect-error loadPyodide is defined globally by pyodide.js
      pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.2/full/",
      });
      return pyodide;
    })();
  }
  return pyodideLoadingPromise;
}

const HARNESS_CODE = `
import sys
import io
import json
import inspect
import re
import traceback

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

    def to_list(self):
        res = []
        curr = self
        visited = set()
        while curr:
            if id(curr) in visited: # Cycle detection
                break
            visited.add(id(curr))
            res.append(curr.val)
            curr = curr.next
        return res

def build_linked_list(arr):
    if not arr or not isinstance(arr, list):
        return None
    head = ListNode(arr[0])
    curr = head
    for v in arr[1:]:
        curr.next = ListNode(v)
        curr = curr.next
    return head

def normalize_output(val):
    if val is None:
        return "null"
    if isinstance(val, ListNode):
        return json.dumps(val.to_list(), separators=(',', ':'))
    if isinstance(val, bool):
        return "true" if val else "false"
    try:
        return json.dumps(val, separators=(',', ':'))
    except:
        return str(val)

def find_callable_entrypoint(scope, initial_keys, problem_title="", args_count=0):
    ignored_names = initial_keys | {'Solution', 'ListNode', 'build_linked_list', 'normalize_output'}

    candidates = []
    if problem_title:
        clean_title = re.sub(r'[^a-zA-Z0-9]', '', problem_title).lower()
        snake_title = re.sub(r'[^a-zA-Z0-9]+', '_', problem_title).strip('_').lower()
        candidates.extend([clean_title, snake_title])
        words = problem_title.lower().split()
        if len(words) > 1:
            candidates.append(words[0] + ''.join(w.capitalize() for w in words[1:]))
            candidates.append('_'.join(words))

    common_aliases = {
        'twosum': ['twosum', 'two_sum'],
        'validanagram': ['isanagram', 'is_anagram', 'validanagram', 'valid_anagram', 'anagram'],
        'reverselinkedlist': ['reverselist', 'reverse_list', 'reverselinkedlist', 'reverse_linked_list'],
        'mergeintervals': ['merge', 'mergeintervals', 'merge_intervals'],
        'subarraysumequalsk': ['subarraysum', 'subarray_sum', 'subarraysumequalsk']
    }
    clean_title_ref = re.sub(r'[^a-zA-Z0-9]', '', problem_title).lower() if problem_title else ''
    for k, aliases in common_aliases.items():
        if clean_title_ref and (k in clean_title_ref or clean_title_ref in k):
            candidates.extend(aliases)

    norm_candidates = {c.lower().replace('_', ''): c for c in candidates}

    # Strategy A: Check class Solution
    if 'Solution' in scope and isinstance(scope['Solution'], type):
        try:
            sol_instance = scope['Solution']()
            methods = [
                m for m in dir(sol_instance)
                if not m.startswith('_') and callable(getattr(sol_instance, m))
            ]
            for m in methods:
                clean_m = m.lower().replace('_', '')
                if clean_m in norm_candidates:
                    return getattr(sol_instance, m), m
            if methods:
                return getattr(sol_instance, methods[0]), methods[0]
        except Exception:
            pass

    # Strategy B: Check top-level functions in scope
    user_funcs = {}
    for k, v in scope.items():
        if k not in ignored_names and not k.startswith('_') and callable(v) and not isinstance(v, type):
            user_funcs[k] = v

    # Match candidates in top-level functions
    for k, fn in user_funcs.items():
        clean_k = k.lower().replace('_', '')
        if clean_k in norm_candidates:
            return fn, k

    # Strategy C: Check function by argument count
    if args_count > 0:
        for k in reversed(list(user_funcs.keys())):
            fn = user_funcs[k]
            try:
                sig = inspect.signature(fn)
                req_params = [
                    p for p in sig.parameters.values()
                    if p.default == inspect.Parameter.empty
                    and p.kind in (inspect.Parameter.POSITIONAL_OR_KEYWORD, inspect.Parameter.POSITIONAL_ONLY)
                ]
                has_varargs = any(p.kind == inspect.Parameter.VAR_POSITIONAL for p in sig.parameters.values())
                if len(req_params) == args_count or has_varargs:
                    return fn, k
            except Exception:
                pass

    # Strategy D: Return the last defined function
    if user_funcs:
        last_key = list(user_funcs.keys())[-1]
        return user_funcs[last_key], last_key

    return None, None

def run_single_test(user_code, input_str, problem_title="", is_linked_list=False):
    stdout_buf = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = stdout_buf

    scope = {
        'ListNode': ListNode,
        'build_linked_list': build_linked_list,
        'List': list,
        'Dict': dict,
        'Tuple': tuple,
        'Set': set,
        'Optional': lambda x: x
    }
    initial_keys = set(scope.keys())

    try:
        exec(user_code, scope)

        raw_lines = input_str.strip().splitlines()
        if len(raw_lines) == 1 and (chr(92) + 'n') in raw_lines[0]:
            raw_lines = raw_lines[0].split(chr(92) + 'n')
        raw_lines = [l.strip() for l in raw_lines if l.strip()]

        args = []
        for line in raw_lines:
            try:
                args.append(json.loads(line))
            except:
                args.append(line)

        fn, fn_name = find_callable_entrypoint(scope, initial_keys, problem_title, len(args))
        if not fn:
            return {
                'success': False,
                'error': f"Could not find a callable solution function for '{problem_title}'. Please implement your function.",
                'stdout': stdout_buf.getvalue(),
                'output': ""
            }

        is_ll = is_linked_list or (fn_name and 'reverse' in fn_name.lower()) or ('linked' in problem_title.lower())
        if is_ll and len(args) > 0 and isinstance(args[0], list):
            args[0] = build_linked_list(args[0])

        result = fn(*args)

        if result is None and stdout_buf.getvalue().strip():
            norm_output = stdout_buf.getvalue().strip()
        else:
            norm_output = normalize_output(result)

        return {
            'success': True,
            'output': norm_output,
            'stdout': stdout_buf.getvalue(),
            'fn_name': fn_name,
            'error': None
        }
    except Exception as ex:
        tb = traceback.format_exc()
        return {
            'success': False,
            'output': "",
            'stdout': stdout_buf.getvalue(),
            'error': str(ex),
            'traceback': tb
        }
    finally:
        sys.stdout = old_stdout
`;

function compareOutputs(actual, expected) {
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    return actual === expected;
  }
  const a = String(actual).trim();
  const e = String(expected).trim();
  if (a === e) return true;
  if (a.toLowerCase() === e.toLowerCase()) return true;

  const aNoSpace = a.replace(/\s+/g, "");
  const eNoSpace = e.replace(/\s+/g, "");
  if (aNoSpace === eNoSpace) return true;

  try {
    const jsonA = JSON.parse(a);
    const jsonE = JSON.parse(e);
    if (JSON.stringify(jsonA) === JSON.stringify(jsonE)) return true;

    // For 2-element index arrays like Two Sum [0, 1] vs [1, 0]
    if (Array.isArray(jsonA) && Array.isArray(jsonE) && jsonA.length === jsonE.length) {
      if (jsonA.length === 2 && typeof jsonA[0] === "number") {
        const sortedA = [...jsonA].sort((x, y) => x - y);
        const sortedE = [...jsonE].sort((x, y) => x - y);
        if (JSON.stringify(sortedA) === JSON.stringify(sortedE)) return true;
      }
    }
  } catch {
    // not JSON
  }
  return false;
}

self.onmessage = async (e) => {
  const { id, type, code, testCases, problemTitle, isLinkedList } = e.data;

  if (type === "INIT") {
    try {
      await initPyodide();
      self.postMessage({ id, type: "INIT_SUCCESS" });
    } catch (err) {
      self.postMessage({ id, type: "INIT_ERROR", error: String(err) });
    }
    return;
  }

  if (type === "RUN_TESTS") {
    try {
      const py = await initPyodide();
      py.runPython(HARNESS_CODE);

      const runSingleTest = py.globals.get("run_single_test");
      const results = [];

      for (let i = 0; i < (testCases || []).length; i++) {
        const tc = testCases[i];
        const startTime = performance.now();

        const pyResult = runSingleTest(code, tc.input, problemTitle || "", Boolean(isLinkedList));
        const jsResult = pyResult.toJs ? pyResult.toJs({ dict_converter: Object.fromEntries }) : pyResult;
        pyResult.destroy?.();

        const executionTimeMs = Math.round((performance.now() - startTime) * 10) / 10;

        let passed = false;
        if (jsResult.success && tc.expectedOutput !== undefined) {
          passed = compareOutputs(jsResult.output, tc.expectedOutput);
        }

        results.push({
          testCaseIndex: i,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: jsResult.output || "",
          passed,
          stdout: jsResult.stdout || "",
          executionTimeMs,
          error: jsResult.error || null,
          traceback: jsResult.traceback || null,
          hidden: Boolean(tc.hidden),
        });
      }

      self.postMessage({
        id,
        type: "RUN_COMPLETE",
        results,
      });
    } catch (err) {
      self.postMessage({
        id,
        type: "RUN_ERROR",
        error: String(err),
      });
    }
  }
};
