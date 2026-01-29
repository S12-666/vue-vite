import * as d3 from 'd3';

class ChartTooltip {
    constructor() {
        this.id = 'chart-global-tooltip';
        this.tooltip = null;
        this.init();
    }

    init() {
        let existing = document.getElementById(this.id);
        if (!existing) {
            this.tooltip = d3.select('body')
                .append('div')
                .attr('id', this.id)
                .style('position', 'absolute')
                .style('z-index', '9999')
                .style('opacity', 0)

                // --- 保留你原本喜欢的视觉样式 ---
                .style('background', 'rgba(255, 255, 255, 0.8)') // 你之前的透明度
                .style('color', '#333')
                .style('border-radius', '4px')
                .style('padding', '8px 12px')
                .style('font-size', '12px')
                .style('border', '1px solid #DCDCDC') // 你之前的边框色
                .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)') // 你之前的阴影
                // -----------------------------

                // 必须加入的功能样式
                .style('pointer-events', 'none') // 防止鼠标遮挡导致闪烁
                .style('transition', 'opacity 0.2s ease, top 0.1s ease, left 0.1s ease') // 平滑移动
                .style('min-width', '100px');
        } else {
            this.tooltip = d3.select(existing);
        }
    }

    show(event, htmlContent, borderColor = null) {
        let contentToRender = htmlContent;
        if (borderColor) {
            contentToRender = `
                <div style="border-left: 3px solid ${borderColor}; padding-left: 8px; text-align: left;">
                    ${htmlContent}
                </div>
            `;
        }
        this.tooltip.html(contentToRender);

        const tooltipNode = this.tooltip.node();
        const tipWidth = tooltipNode.offsetWidth;
        const tipHeight = tooltipNode.offsetHeight;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let x = event.pageX + 15;
        let y = event.pageY + 15;

        if (x + tipWidth > windowWidth) {
            x = event.pageX - tipWidth - 15;
        }

        if (y + tipHeight > windowHeight) {
            y = event.pageY - tipHeight - 15;
        }

        this.tooltip
            .style('left', `${x}px`)
            .style('top', `${y}px`)
            .style('opacity', 1);
    }

    hide() {
        if (this.tooltip) {
            this.tooltip.style('opacity', 0);
        }
    }
}

export const chartTooltip = new ChartTooltip();