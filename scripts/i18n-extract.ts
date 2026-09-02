import { Project, SyntaxKind, Node, JsxText, StringLiteral } from "ts-morph";
import fs from "fs";
import path from "path";

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const sourceFiles = project.getSourceFiles("src/**/*.{tsx,ts}");

const extracted: Record<string, string> = {};

function toKey(text: string): string {
  // convert text to camelCase key or just sanitize it
  // if it's very long, maybe just use snake_case of first few words
  let clean = text.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  if (!clean) return "empty_key";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 5) {
    clean = words.slice(0, 5).join(" ");
  }
  const key = clean
    .split(/\s+/)
    .map((word, i) => {
      if (i === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
  return key || "empty_key";
}

let changedFiles = 0;

for (const sf of sourceFiles) {
  let fileChanged = false;
  let hasUseLanguageImport = sf.getImportDeclaration((dec) =>
    dec.getModuleSpecifierValue().includes("LanguageContext"),
  );

  const functionDeclarations = sf.getDescendantsOfKind(
    SyntaxKind.FunctionDeclaration,
  );
  const variableDeclarations = sf.getDescendantsOfKind(
    SyntaxKind.VariableDeclaration,
  );

  // We need to find React components to inject `const { t } = useLanguage();`
  // A heuristic for a React component: it returns JSX.
  const components = [
    ...functionDeclarations,
    ...variableDeclarations.filter((v) =>
      v.getInitializerIfKind(SyntaxKind.ArrowFunction),
    ),
  ];

  for (const comp of components) {
    let body;
    let name;
    if (comp.getKind() === SyntaxKind.FunctionDeclaration) {
      body = comp.asKind(SyntaxKind.FunctionDeclaration)?.getBody();
      name = comp.asKind(SyntaxKind.FunctionDeclaration)?.getName();
    } else {
      const arrowFunc = comp
        .asKind(SyntaxKind.VariableDeclaration)
        ?.getInitializerIfKind(SyntaxKind.ArrowFunction);
      body = arrowFunc?.getBody();
      name = comp.asKind(SyntaxKind.VariableDeclaration)?.getName();
    }

    if (!body || !name) continue;
    if (!name || name.charAt(0) !== name.charAt(0).toUpperCase()) continue; // Usually components start with uppercase

    // Check if it returns JSX
    const hasJsx = body
      .getDescendants()
      .some(
        (d) =>
          d.getKind() === SyntaxKind.JsxElement ||
          d.getKind() === SyntaxKind.JsxSelfClosingElement ||
          d.getKind() === SyntaxKind.JsxFragment,
      );

    if (!hasJsx) continue;

    // Check if it already has `const { t } = useLanguage()`
    let hasT = false;
    body.getDescendantsOfKind(SyntaxKind.VariableDeclaration).forEach((vd) => {
      if (vd.getInitializer()?.getText().includes("useLanguage()")) {
        hasT = true;
      }
    });

    // Now, find all strings inside this component that are user facing
    const jsxElements = body.getDescendantsOfKind(SyntaxKind.JsxElement);
    const jsxSelfClosing = body.getDescendantsOfKind(
      SyntaxKind.JsxSelfClosingElement,
    );
    const jsxTextNodes = body.getDescendantsOfKind(SyntaxKind.JsxText);

    let compChanged = false;

    // Replace JSX Text
    for (const textNode of jsxTextNodes) {
      const text = textNode.getLiteralText();
      const trimmed = text.trim();
      if (trimmed && !/^[0-9\W]+$/.test(trimmed)) {
        // Not just numbers/symbols
        const key = toKey(trimmed);
        if (!extracted[key]) extracted[key] = trimmed;
        // replace
        textNode.replaceWithText(`{t("${key}")}`);
        compChanged = true;
      }
    }

    // Replace JSX Attributes like placeholder, label, title, description
    const jsxAttributes = body.getDescendantsOfKind(SyntaxKind.JsxAttribute);
    for (const attr of jsxAttributes) {
      const attrNameNode = attr.getNameNode();
      const attrName = attrNameNode ? attrNameNode.getText() : "";
      if (
        ["placeholder", "label", "title", "description", "alt", "message", "confirmLabel", "cancelLabel", "subtitle"].includes(
          attrName,
        )
      ) {
        const init = attr.getInitializer();
        if (init && init.getKind() === SyntaxKind.StringLiteral) {
          const literal = init as StringLiteral;
          const text = literal.getLiteralValue().trim();
          if (text && !/^[0-9\W]+$/.test(text)) {
            const key = toKey(text);
            if (!extracted[key]) extracted[key] = text;
            attr.setInitializer(`{t("${key}")}`);
            compChanged = true;
          }
        }
      }
    }

    if (compChanged) {
      fileChanged = true;
      if (!hasT && body.getKind() === SyntaxKind.Block) {
        body
          .asKind(SyntaxKind.Block)
          ?.insertStatements(0, "const { t } = useLanguage();");
      }
    }
  }

  if (fileChanged) {
    if (!hasUseLanguageImport) {
      // Add import
      // Determine relative path to src/context/LanguageContext
      const sfPath = sf.getFilePath();
      const contextPath = path.resolve(
        process.cwd(),
        "src/context/LanguageContext",
      );
      let relative = path.relative(path.dirname(sfPath), contextPath);
      if (!relative.startsWith(".")) relative = "./" + relative;
      relative = relative.replace(/\\/g, "/");
      sf.addImportDeclaration({
        namedImports: ["useLanguage"],
        moduleSpecifier: relative,
      });
    }
    sf.saveSync();
    changedFiles++;
  }
}

fs.writeFileSync("extracted_en.json", JSON.stringify(extracted, null, 2));
console.log(
  `Processed ${changedFiles} files. Extracted ${Object.keys(extracted).length} strings.`,
);
