import { prisma } from "@/lib/prisma";
import { mockSettings } from "@/data/mock/settings";
import type { SettingSection } from "@/types";

export async function getInstitutionSettings(): Promise<SettingSection[]> {
  try {
    const dbSettings = await prisma.institutionSetting.findMany();
    if (dbSettings.length > 0) {
      // Group by section
      const grouped: Record<string, SettingSection> = {};
      for (const s of dbSettings) {
        if (!grouped[s.section]) {
          grouped[s.section] = {
            id: s.section,
            title: s.section.charAt(0).toUpperCase() + s.section.slice(1) + " Settings",
            description: `Configuration parameters for ${s.section}`,
            settings: [],
          };
        }
        grouped[s.section].settings.push({
          id: s.key,
          label: s.label,
          description: s.description || undefined,
          type: s.type as "text" | "number" | "toggle" | "select",
          value: s.type === "toggle" ? s.value === "true" : s.value,
          options: s.options,
        });
      }
      return Object.values(grouped);
    }
  } catch {
    // Fallback
  }

  return mockSettings;
}

export async function updateInstitutionSetting(key: string, value: string | boolean | number): Promise<void> {
  try {
    await prisma.institutionSetting.upsert({
      where: { key },
      update: {
        value: String(value),
      },
      create: {
        key,
        section: "institution",
        label: key,
        type: typeof value === "boolean" ? "toggle" : "text",
        value: String(value),
      },
    });
  } catch {
    // Fallback simulation
  }
}
