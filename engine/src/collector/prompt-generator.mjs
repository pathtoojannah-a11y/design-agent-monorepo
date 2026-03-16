export function generateIntegrationPrompt({
  componentName,
  componentCode,
  demoCode,
  dependencyFiles = [],
  npmPackages = [],
  shadcnDeps = [],
  installCommand,
  adaptationGuidance = []
}) {
  const lines = [];

  lines.push(`You are given a task to integrate an existing React component into a codebase.`);
  lines.push(`The codebase should support: shadcn, Tailwind CSS, TypeScript, React.`);
  lines.push("");

  if (componentCode) {
    lines.push(`## Component Code`);
    lines.push(`Copy-paste this component to \`/components/ui/${toFileName(componentName)}.tsx\`:`);
    lines.push("");
    lines.push("```tsx");
    lines.push(componentCode);
    lines.push("```");
    lines.push("");
  }

  if (demoCode) {
    lines.push(`## Demo / Usage`);
    lines.push("");
    lines.push("```tsx");
    lines.push(demoCode);
    lines.push("```");
    lines.push("");
  }

  if (dependencyFiles.length > 0) {
    lines.push(`## Dependency Files`);
    lines.push("");

    for (const dep of dependencyFiles) {
      const depPath = dep.path ?? `/components/ui/${toFileName(dep.name)}.tsx`;
      lines.push(`### \`${depPath}\``);
      lines.push("");
      lines.push("```tsx");
      lines.push(dep.source ?? dep.content ?? "");
      lines.push("```");
      lines.push("");
    }
  }

  const allPackages = [...new Set([...npmPackages, ...shadcnDeps.map((d) => `shadcn: ${d}`)])];
  if (allPackages.length > 0 || installCommand) {
    lines.push(`## Install NPM Dependencies`);
    lines.push("");

    if (installCommand) {
      lines.push("```bash");
      lines.push(installCommand);
      lines.push("```");
    } else if (npmPackages.length > 0) {
      lines.push("```bash");
      lines.push(`npm install ${npmPackages.join(" ")}`);
      lines.push("```");
    }

    if (shadcnDeps.length > 0) {
      lines.push("");
      lines.push("```bash");
      lines.push(`npx shadcn@latest add ${shadcnDeps.join(" ")}`);
      lines.push("```");
    }

    lines.push("");
  }

  lines.push(`## Implementation Guidelines`);
  lines.push("");
  lines.push(`1. Copy the component code to your \`/components/ui\` folder`);

  if (dependencyFiles.length > 0) {
    lines.push(`2. Copy all dependency files to their respective paths`);
  }

  if (npmPackages.length > 0 || installCommand) {
    lines.push(`${dependencyFiles.length > 0 ? "3" : "2"}. Install the listed NPM dependencies`);
  }

  lines.push(`${dependencyFiles.length > 0 && npmPackages.length > 0 ? "4" : dependencyFiles.length > 0 || npmPackages.length > 0 ? "3" : "2"}. Ensure \`@/lib/utils\` (shadcn cn utility) is available`);

  if (adaptationGuidance.length > 0) {
    lines.push("");
    lines.push(`## Adaptation Notes`);
    lines.push("");

    for (const note of adaptationGuidance) {
      lines.push(`- ${note}`);
    }
  }

  return lines.join("\n");
}

function toFileName(name) {
  if (!name) {
    return "component";
  }

  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "component";
}
