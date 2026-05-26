import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';

interface Props {
  name: string;
  size?: number;
  color?: string;
  style?: object;
}

export default function Icon({ name, size = 24, color = '#000', style }: Props) {
  const s = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const d = s;

  function paths() {
    switch (name) {
      case 'alert-circle':
        return (<>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Line x1="12" y1="8" x2="12" y2="12" {...s} />
          <Line x1="12" y1="16" x2="12.01" y2="16" {...s} />
        </>);
      case 'bar-chart-2':
        return (<>
          <Line x1="18" y1="20" x2="18" y2="10" {...s} />
          <Line x1="12" y1="20" x2="12" y2="4" {...s} />
          <Line x1="6" y1="20" x2="6" y2="14" {...s} />
        </>);
      case 'bell':
        return (<>
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...s} />
          <Path d="M13.73 21a2 2 0 0 1-3.46 0" {...s} />
        </>);
      case 'book-open':
        return (<>
          <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" {...s} />
          <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" {...s} />
        </>);
      case 'calendar':
        return (<>
          <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" {...s} />
          <Line x1="16" y1="2" x2="16" y2="6" {...s} />
          <Line x1="8" y1="2" x2="8" y2="6" {...s} />
          <Line x1="3" y1="10" x2="21" y2="10" {...s} />
        </>);
      case 'check':
        return <Polyline points="20 6 9 17 4 12" {...s} />;
      case 'check-circle':
        return (<>
          <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" {...s} />
          <Polyline points="22 4 12 14.01 9 11.01" {...s} />
        </>);
      case 'check-square':
        return (<>
          <Polyline points="9 11 12 14 22 4" {...s} />
          <Path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" {...s} />
        </>);
      case 'chevron-left':
        return <Polyline points="15 18 9 12 15 6" {...s} />;
      case 'chevron-right':
        return <Polyline points="9 18 15 12 9 6" {...s} />;
      case 'clock':
        return (<>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Polyline points="12 6 12 12 16 14" {...s} />
        </>);
      case 'database':
        return (<>
          <Ellipse cx="12" cy="5" rx="9" ry="3" {...s} />
          <Path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" {...s} />
          <Path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" {...s} />
        </>);
      case 'edit-2':
        return <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" {...s} />;
      case 'frown':
        return (<>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Path d="M16 16s-1.5-2-4-2-4 2-4 2" {...s} />
          <Line x1="9" y1="9" x2="9.01" y2="9" {...s} />
          <Line x1="15" y1="9" x2="15.01" y2="9" {...s} />
        </>);
      case 'grid':
        return (<>
          <Rect x="3" y="3" width="7" height="7" {...s} />
          <Rect x="14" y="3" width="7" height="7" {...s} />
          <Rect x="14" y="14" width="7" height="7" {...s} />
          <Rect x="3" y="14" width="7" height="7" {...s} />
        </>);
      case 'heart':
        return <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" {...s} />;
      case 'layers':
        return (<>
          <Polygon points="12 2 2 7 12 12 22 7 12 2" {...s} />
          <Polyline points="2 17 12 22 22 17" {...s} />
          <Polyline points="2 12 12 17 22 12" {...s} />
        </>);
      case 'meh':
        return (<>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Line x1="8" y1="15" x2="16" y2="15" {...s} />
          <Line x1="9" y1="9" x2="9.01" y2="9" {...s} />
          <Line x1="15" y1="9" x2="15.01" y2="9" {...s} />
        </>);
      case 'minus-circle':
        return (<>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Line x1="8" y1="12" x2="16" y2="12" {...s} />
        </>);
      case 'moon':
        return <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" {...s} />;
      case 'plus':
        return (<>
          <Line x1="12" y1="5" x2="12" y2="19" {...s} />
          <Line x1="5" y1="12" x2="19" y2="12" {...s} />
        </>);
      case 'repeat':
        return (<>
          <Polyline points="17 1 21 5 17 9" {...s} />
          <Path d="M3 11V9a4 4 0 0 1 4-4h14" {...s} />
          <Polyline points="7 23 3 19 7 15" {...s} />
          <Path d="M21 13v2a4 4 0 0 1-4 4H3" {...s} />
        </>);
      case 'save':
        return (<>
          <Path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" {...s} />
          <Polyline points="17 21 17 13 7 13 7 21" {...s} />
          <Polyline points="7 3 7 8 15 8" {...s} />
        </>);
      case 'shield':
        return <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...s} />;
      case 'sliders':
        return (<>
          <Line x1="4" y1="21" x2="4" y2="14" {...s} />
          <Line x1="4" y1="10" x2="4" y2="3" {...s} />
          <Line x1="12" y1="21" x2="12" y2="12" {...s} />
          <Line x1="12" y1="8" x2="12" y2="3" {...s} />
          <Line x1="20" y1="21" x2="20" y2="16" {...s} />
          <Line x1="20" y1="12" x2="20" y2="3" {...s} />
          <Line x1="1" y1="14" x2="7" y2="14" {...s} />
          <Line x1="9" y1="8" x2="15" y2="8" {...s} />
          <Line x1="17" y1="16" x2="23" y2="16" {...s} />
        </>);
      case 'smile':
        return (<>
          <Circle cx="12" cy="12" r="10" {...s} />
          <Path d="M8 13s1.5 2 4 2 4-2 4-2" {...s} />
          <Line x1="9" y1="9" x2="9.01" y2="9" {...s} />
          <Line x1="15" y1="9" x2="15.01" y2="9" {...s} />
        </>);
      case 'star':
        return <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" {...s} />;
      case 'trash-2':
        return (<>
          <Polyline points="3 6 5 6 21 6" {...s} />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...s} />
          <Line x1="10" y1="11" x2="10" y2="17" {...s} />
          <Line x1="14" y1="11" x2="14" y2="17" {...s} />
        </>);
      case 'trending-up':
        return (<>
          <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" {...s} />
          <Polyline points="17 6 23 6 23 12" {...s} />
        </>);
      case 'wifi-off':
        return (<>
          <Line x1="1" y1="1" x2="23" y2="23" {...s} />
          <Path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" {...s} />
          <Path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" {...s} />
          <Path d="M10.71 5.05A16 16 0 0 1 22.56 9" {...s} />
          <Path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" {...s} />
          <Path d="M8.53 16.11a6 6 0 0 1 6.95 0" {...s} />
          <Line x1="12" y1="20" x2="12.01" y2="20" {...s} />
        </>);
      case 'x':
        return (<>
          <Line x1="18" y1="6" x2="6" y2="18" {...s} />
          <Line x1="6" y1="6" x2="18" y2="18" {...s} />
        </>);
      case 'zap':
        return <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" {...s} />;
      default:
        return <Path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" {...s} />;
    }
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {paths()}
    </Svg>
  );
}
