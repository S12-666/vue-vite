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
                .style('background', 'rgba(255, 255, 255, 0.8)')
                .style('color', '#333')
                .style('border-radius', '4px')
                .style('padding', '8px 12px')
                .style('font-size', '12px')
                .style('pointer-events', 'none') // 防止鼠标挡住触发 mouseout
                .style('border', '1px solid #DCDCDC')
                .style('box-shadow', '0 2px 8px rgba(0,0,0,0.3)')
                .style('transition', 'opacity 0.2s ease, top 0.1s ease, left 0.1s ease');
        } else {
            this.tooltip = d3.select(existing);
        }
    }
    show(event, htmlContent) {
        const x = event.pageX + 15; // 往右偏一点
        const y = event.pageY + 15; // 往下偏一点

        this.tooltip
            .html(htmlContent)
            .style('left', `${x}px`)
            .style('top', `${y}px`)
            .style('opacity', 1);
    }

    hide() {
        this.tooltip.style('opacity', 0);
    }
}

export const chartTooltip = new ChartTooltip();