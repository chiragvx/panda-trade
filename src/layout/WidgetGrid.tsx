import React, { useState, useEffect, useRef } from 'react';
import { Responsive, useContainerWidth, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WidgetWrapper } from './WidgetWrapper';
import { Widget } from '../types';

interface WidgetGridProps {
  widgets: Widget[];
  onRemoveWidget: (id: string) => void;
  onToggleWidgetLink: (id: string) => void;
  onRefreshWidget: (id: string) => void;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({ 
  widgets, 
  onRemoveWidget, 
  onToggleWidgetLink,
  onRefreshWidget 
}) => {
  const { width, containerRef } = useContainerWidth();
  const [layouts, setLayouts] = useState<{[key: string]: Layout[]}>({
    lg: widgets.map((w, i) => ({
      i: w.id,
      x: (i % 6) * w.defaultSize.w,
      y: Math.floor(i / 6) * w.defaultSize.h,
      w: w.defaultSize.w,
      h: w.defaultSize.h,
      minW: w.minSize.w,
      minH: w.minSize.h,
    })),
  });

  const onLayoutChange = (currentLayout: Layout[], allLayouts: {[key: string]: Layout[]}) => {
    setLayouts(allLayouts);
    localStorage.setItem('opentrader_grid_layout', JSON.stringify(allLayouts));
  };

  useEffect(() => {
    const saved = localStorage.getItem('opentrader_grid_layout');
    if (saved) {
      setLayouts(JSON.parse(saved));
    }
  }, []);

  return (
    <div ref={containerRef as any} className="w-full h-full overflow-y-auto overflow-x-hidden p-6 bg-[#050505] custom-scrollbar">
      {width > 0 && (
        <Responsive
          className="layout"
          layouts={layouts}
          width={width}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          draggableHandle=".drag-handle"
          onLayoutChange={onLayoutChange}
          margin={[16, 16]}
        >
          {widgets.map((widget) => (
            <div key={widget.id}>
              <WidgetWrapper
                id={widget.id}
                title={widget.title}
                isLinked={widget.isLinked}
                onRemove={() => onRemoveWidget(widget.id)}
                onToggleLink={() => onToggleWidgetLink(widget.id)}
                onRefresh={() => onRefreshWidget(widget.id)}
                className="h-full w-full"
              >
                <widget.component id={widget.id} isLinked={widget.isLinked} />
              </WidgetWrapper>
            </div>
          ))}
        </Responsive>
      )}
    </div>
  );
};
