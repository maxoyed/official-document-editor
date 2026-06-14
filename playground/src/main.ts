import {
  createOfficialDocumentEditor,
  redHeadDocumentTemplate,
  renderPaginatedPreview,
  countPages,
  blocksFromDoc,
  validateDocument,
  inferDocType,
  toArabicDate,
  documentTemplates,
  type Editor,
  type OfficialElement,
} from "@maxoyed/ode-core";
import { toDocxBlob, fromDocx } from "@maxoyed/ode-core/docx";
import "@maxoyed/ode-core/styles.css";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

app.innerHTML = `
  <div class="toolbar">
    <strong>公文要素：</strong>
    <button data-role="title">标题</button>
    <button data-role="mainRecipient">主送机关</button>
    <button data-role="body">正文</button>
    <button data-role="headingLevel1">一级标题</button>
    <button data-role="headingLevel2">二级标题</button>
    <button data-role="signature">署名</button>
    <button data-role="dateline">成文日期</button>
    <span class="spacer"></span>
    <label class="toggle"><input type="checkbox" id="inline-paging" /> 内联分页</label>
    <span class="pagecount" id="pagecount"></span>
    <button data-cmd="fill">填充长文</button>
    <button data-cmd="table">插入表格</button>
    <button data-cmd="image">插入图片</button>
    <button data-cmd="seal">插入印章</button>
    <button data-cmd="record">版记线</button>
    <button data-cmd="validate">校验</button>
    <button data-cmd="normdate">日期→阿拉伯</button>
    <label class="tpl-label">文种：<select id="tpl"></select></label>
    <button data-cmd="import">导入 docx</button>
    <button data-cmd="export">导出 docx</button>
    <button data-cmd="print">打印 / 导出 PDF</button>
    <input type="file" id="file" accept=".docx" hidden />
    <input type="file" id="imgfile" accept="image/*" hidden />
  </div>
  <div class="validate-bar" id="validate-bar" hidden></div>
  <div class="panes">
    <section class="pane">
      <header>编辑</header>
      <div class="odoc-canvas">
        <div class="odoc-page" id="page"></div>
      </div>
    </section>
    <section class="pane">
      <header>分页预览（A4 · 每面 22 行）</header>
      <div id="preview"></div>
    </section>
  </div>
`;

const page = document.querySelector<HTMLDivElement>("#page")!;
const preview = document.querySelector<HTMLDivElement>("#preview")!;
const pagecount = document.querySelector<HTMLSpanElement>("#pagecount")!;

let editor: Editor;

function refreshPreview() {
  const doc = editor.getJSON();
  const pages = renderPaginatedPreview(doc, preview);
  const estimate = countPages(blocksFromDoc(doc));
  pagecount.textContent = `预览 ${pages} 页 · 引擎估算 ${estimate} 页`;
}

function mountEditor(paginated: boolean, content = redHeadDocumentTemplate() as unknown) {
  editor?.destroy();
  page.innerHTML = "";
  editor = createOfficialDocumentEditor({
    element: page,
    content: content as ReturnType<typeof redHeadDocumentTemplate>,
    pagination: paginated,
  });
  editor.on("update", refreshPreview);
  // 便于联调/验证
  Object.assign(window as unknown as Record<string, unknown>, {
    __editor: editor,
    __docx: { toDocxBlob, fromDocx },
  });
  refreshPreview();
}

mountEditor(false);

const inlinePaging = document.querySelector<HTMLInputElement>("#inline-paging")!;
inlinePaging.addEventListener("change", () => {
  mountEditor(inlinePaging.checked, editor.getJSON());
});

document.querySelectorAll<HTMLButtonElement>("button[data-role]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const role = btn.dataset.role as OfficialElement;
    editor.chain().focus().setOfficialRole(role).run();
  });
});

const cmd = (name: string) =>
  document.querySelector<HTMLButtonElement>(`button[data-cmd="${name}"]`)!;

// 文种选择：列出内置模板，选择即载入
const tplSelect = document.querySelector<HTMLSelectElement>("#tpl")!;
tplSelect.innerHTML = documentTemplates
  .map((t) => `<option value="${t.key}">${t.label}${t.direction !== "—" ? `（${t.direction}文）` : ""}</option>`)
  .join("");
tplSelect.addEventListener("change", () => {
  const tpl = documentTemplates.find((t) => t.key === tplSelect.value);
  if (tpl) {
    editor.commands.setContent(tpl.build());
    refreshPreview();
  }
});

cmd("fill").addEventListener("click", () => {
  // 追加多段长正文，便于验证跨页分页
  const para =
    "本段为测试正文，用于验证公文分页效果。根据有关工作部署和实际情况，现就相关事项作出安排，请各单位认真贯彻落实，确保各项任务落到实处、见到实效。";
  const chain = editor.chain().focus();
  for (let i = 0; i < 12; i++) {
    chain.command(({ commands }) => commands.insertContent({
      type: "paragraph",
      attrs: { officialRole: "body" },
      content: [{ type: "text", text: para }],
    }));
  }
  chain.run();
  refreshPreview();
});

cmd("table").addEventListener("click", () => {
  editor
    .chain()
    .focus()
    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
    .run();
  refreshPreview();
});

const imgInput = document.querySelector<HTMLInputElement>("#imgfile")!;
let asSeal = false;
cmd("image").addEventListener("click", () => {
  asSeal = false;
  imgInput.click();
});
cmd("seal").addEventListener("click", () => {
  asSeal = true;
  imgInput.click();
});
imgInput.addEventListener("change", () => {
  const file = imgInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    editor
      .chain()
      .focus()
      .insertContent({ type: "image", attrs: { src: String(reader.result), seal: asSeal } })
      .run();
    refreshPreview();
  };
  reader.readAsDataURL(file);
  imgInput.value = "";
});

cmd("record").addEventListener("click", () => {
  editor.chain().focus().setHorizontalRuleVariant("record").run();
  refreshPreview();
});

// 成文日期规范化为阿拉伯数字（GB/T 9704）
cmd("normdate").addEventListener("click", () => {
  const doc = editor.getJSON();
  let changed = false;
  for (const node of doc.content ?? []) {
    const t = node.attrs?.officialRole === "dateline" ? node.content?.[0]?.text : undefined;
    if (t) {
      const a = toArabicDate(t);
      if (a !== t) {
        node.content![0].text = a;
        changed = true;
      }
    }
  }
  if (changed) {
    editor.commands.setContent(doc);
    refreshPreview();
  }
});

const validateBar = document.querySelector<HTMLDivElement>("#validate-bar")!;

const DOCTYPE_LABEL: Record<string, string> = {
  notice: "通知", request: "请示", report: "报告", reply: "批复",
  letter: "函", circular: "通报", minutes: "纪要", generic: "通用",
};

// 滚动并闪烁高亮第 index 个顶层块
function flashBlock(index: number) {
  const view = editor.view;
  const offsets: number[] = [];
  view.state.doc.forEach((_n, off) => offsets.push(off));
  const pos = offsets[index];
  if (pos == null) return;
  const dom = view.nodeDOM(pos) as HTMLElement | null;
  if (!dom || typeof dom.scrollIntoView !== "function") return;
  dom.scrollIntoView({ block: "center", behavior: "smooth" });
  dom.classList.add("odoc-flash");
  setTimeout(() => dom.classList.remove("odoc-flash"), 1600);
}

cmd("validate").addEventListener("click", () => {
  const doc = editor.getJSON();
  const issues = validateDocument(doc);
  const typeLabel = DOCTYPE_LABEL[inferDocType(doc)] ?? "";
  validateBar.hidden = false;
  if (issues.length === 0) {
    validateBar.className = "validate-bar ok";
    validateBar.textContent = `✓ 校验通过（识别为「${typeLabel}」）：未发现问题`;
    return;
  }
  validateBar.className = "validate-bar";
  validateBar.innerHTML =
    `<span class="vtype">文种：${typeLabel}</span>` +
    issues
      .map(
        (i) =>
          `<span class="issue ${i.level}"${
            i.blockIndex !== undefined ? ` data-idx="${i.blockIndex}" role="button"` : ""
          }>${i.level === "error" ? "✕" : "!"} ${i.message}</span>`,
      )
      .join("");
});

// 点击带 data-idx 的问题 → 高亮对应段落
validateBar.addEventListener("click", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>(".issue[data-idx]");
  if (el) flashBlock(Number(el.dataset.idx));
});

cmd("export").addEventListener("click", async () => {
  const blob = await toDocxBlob(editor.getJSON());
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "公文.docx";
  a.click();
  URL.revokeObjectURL(url);
});

const fileInput = document.querySelector<HTMLInputElement>("#file")!;
cmd("import").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const buf = await file.arrayBuffer();
  editor.commands.setContent(fromDocx(buf));
  refreshPreview();
  fileInput.value = "";
});

cmd("print").addEventListener("click", () => {
  // 打印样式只输出右侧分页预览（见 style.css 的 @media print）
  window.print();
});
