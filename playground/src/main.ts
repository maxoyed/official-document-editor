import {
  createOfficialDocumentEditor,
  redHeadDocumentTemplate,
  renderPaginatedPreview,
  countPages,
  blocksFromDoc,
  type Editor,
  type OfficialElement,
} from "@odoc/core";
import { toDocxBlob, fromDocx } from "@odoc/core/docx";
import "@odoc/core/styles.css";
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
    <button data-cmd="reset">载入红头模板</button>
    <button data-cmd="import">导入 docx</button>
    <button data-cmd="export">导出 docx</button>
    <button data-cmd="print">打印 / 导出 PDF</button>
    <input type="file" id="file" accept=".docx" hidden />
  </div>
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

cmd("reset").addEventListener("click", () => {
  editor.commands.setContent(redHeadDocumentTemplate());
  refreshPreview();
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
