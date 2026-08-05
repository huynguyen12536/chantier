import Svg, { Rect, Path } from 'react-native-svg';

export function FlagFR() {
  return (
    <Svg width={48} height={32} viewBox="0 0 30 20">
      <Rect width="10" height="20" fill="#002395" />
      <Rect x="10" width="10" height="20" fill="#EDEDED" />
      <Rect x="20" width="10" height="20" fill="#ED2939" />
    </Svg>
  );
}

export function FlagGB() {
  return (
    <Svg width={48} height={32} viewBox="0 0 60 40">
      <Rect width="60" height="40" fill="#012169" />
      <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
      <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="4" />
      <Path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="12" />
      <Path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="8" />
    </Svg>
  );
}
