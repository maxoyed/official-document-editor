import {
  createOfficialDocumentEditor,
  redHeadDocumentTemplate,
  type Editor,
  type OfficialElement,
} from "@odoc/core";
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
    <button data-cmd="reset">载入红头模板</button>
  </div>
  <div class="odoc-canvas">
    <div class="odoc-page" id="page"></div>
  </div>
`;

const page = document.querySelector<HTMLDivElement>("#page")!;

const editor: Editor = createOfficialDocumentEditor({
  element: page,
  content: redHeadDocumentTemplate(),
});

document.querySelectorAll<HTMLButtonElement>("button[data-role]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const role = btn.dataset.role as OfficialElement;
    editor.chain().focus().setOfficialRole(role).run();
  });
});

document
  .querySelector<HTMLButtonElement>('button[data-cmd="reset"]')!
  .addEventListener("click", () => {
    editor.commands.setContent(redHeadDocumentTemplate());
  });
