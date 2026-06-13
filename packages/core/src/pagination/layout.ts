/**
 * 断页几何（headless，纯函数，可单测）。
 *
 * 输入各顶层块在“连续排布”下的自然位置（top/height，单位 px），输出应在何处插入
 * 分页间隔（spacer）以将内容可视化为多页。被编辑器内联分页插件用于驱动装饰渲染。
 *
 * v1 以块为断页粒度：跨页边界的块整体移至下一页；超过整页高度的单块允许溢出
 * （留待后续按行拆分）。
 */

export interface BlockRect {
  /** 块在编辑区内的自然顶端（相对编辑区顶部，px） */
  top: number;
  /** 块高度（px） */
  height: number;
}

export interface PageBreakOptions {
  /** 每页版心可用内容高度（px） */
  pageContentPx: number;
  /** 两页之间的视觉间隔（px）：上一页地脚 + 页间距 + 下一页天头 */
  breakExtraPx: number;
}

export interface PageBreak {
  /** 在第几个块之前插入分隔（块下标） */
  beforeIndex: number;
  /** 新页的页码（从 2 起） */
  pageNo: number;
  /** 需要插入的间隔高度（px） */
  spacerPx: number;
}

export interface PageBreakResult {
  breaks: PageBreak[];
  pageCount: number;
}

/**
 * 计算分页断点。
 */
export function computePageBreaks(
  blocks: BlockRect[],
  options: PageBreakOptions,
): PageBreakResult {
  const { pageContentPx, breakExtraPx } = options;
  const breaks: PageBreak[] = [];
  if (blocks.length === 0) return { breaks, pageCount: 1 };

  let pageNo = 1;
  let pageStart = blocks[0].top; // 当前页内容的自然起始 y

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    const relBottom = b.top + b.height - pageStart;
    const isFirstOnPage = b.top <= pageStart + 0.5;

    if (relBottom > pageContentPx && !isFirstOnPage) {
      const remaining = pageContentPx - (b.top - pageStart); // 上一页剩余空白
      breaks.push({
        beforeIndex: i,
        pageNo: pageNo + 1,
        spacerPx: Math.max(0, remaining) + breakExtraPx,
      });
      pageNo += 1;
      pageStart = b.top;
    }
  }

  return { breaks, pageCount: pageNo };
}
