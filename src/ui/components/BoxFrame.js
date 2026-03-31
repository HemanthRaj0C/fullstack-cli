import React from 'react';
import { Box, Text } from 'ink';
import { colors, box } from '../theme.js';

/**
 * BoxFrame - Reusable cyberpunk-style box frame component
 * Creates ASCII-art style borders with optional title
 */
export function BoxFrame({ 
  children, 
  title = null, 
  width = '100%',
  height,
  borderColor = colors.primary,
  titleColor = colors.secondary,
  padding = 1,
  marginBottom = 0,
  marginTop = 0,
  titleAlign = 'center', // 'left', 'center', 'right'
  style = 'single', // 'single', 'double', 'plus'
  rightLabel = null, // Label on the right side of title bar
}) {
  // Build title bar
  const renderTitleBar = () => {
    if (!title && !rightLabel) return null;

    const titleText = title ? ` ${title} ` : '';
    const rightText = rightLabel ? ` ${rightLabel} ` : '';

    return React.createElement(
      Box,
      { flexDirection: 'row', justifyContent: 'space-between' },
      React.createElement(
        Text,
        { color: titleColor, bold: true },
        `${box.titleLeft}${box.h}${titleText}${box.h}${box.titleRight}`
      ),
      rightLabel && React.createElement(
        Text,
        { color: colors.muted },
        rightText
      )
    );
  };

  // Determine border style
  const getBorderStyle = () => {
    switch (style) {
      case 'double':
        return 'double';
      case 'plus':
        return 'classic';
      case 'round':
        return 'round';
      case 'single':
      default:
        return 'single';
    }
  };

  return React.createElement(
    Box,
    {
      flexDirection: 'column',
      width,
      height,
      marginBottom,
      marginTop,
    },
    // Title bar (outside the border)
    title && React.createElement(
      Box,
      { marginBottom: 0 },
      React.createElement(
        Text,
        { color: titleColor, bold: true },
        `${box.titleLeft}${box.h} ${title.toUpperCase()} ${box.h}${box.titleRight}`
      ),
      rightLabel && React.createElement(
        Text,
        { color: colors.muted, marginLeft: 2 },
        rightLabel
      )
    ),
    // Main content box with border
    React.createElement(
      Box,
      {
        flexDirection: 'column',
        borderStyle: getBorderStyle(),
        borderColor,
        paddingX: padding,
        paddingY: padding > 0 ? Math.max(0, padding - 1) : 0,
        width: '100%',
        height: height ? height - (title ? 1 : 0) : undefined,
      },
      children
    )
  );
}

/**
 * TitleBar - Standalone title bar component
 * For use above content sections
 */
export function TitleBar({
  title,
  rightLabel = null,
  color = colors.secondary,
  width,
}) {
  return React.createElement(
    Box,
    { 
      flexDirection: 'row', 
      justifyContent: 'space-between',
      width,
    },
    React.createElement(
      Text,
      { color, bold: true },
      `${box.titleLeft}${box.h} ${title.toUpperCase()} ${box.h}${box.titleRight}`
    ),
    rightLabel && React.createElement(
      Text,
      { color: colors.muted },
      rightLabel
    )
  );
}

/**
 * Divider - Horizontal line divider
 */
export function Divider({ 
  width = 40, 
  color = colors.muted,
  char = box.h,
}) {
  return React.createElement(
    Text,
    { color },
    char.repeat(width)
  );
}

/**
 * AccentText - Text with vertical accent bar (like in the reference)
 */
export function AccentText({
  children,
  accentColor = colors.secondary,
  textColor = colors.text,
}) {
  return React.createElement(
    Box,
    { flexDirection: 'row', gap: 1 },
    React.createElement(Text, { color: accentColor }, '│'),
    React.createElement(Text, { color: textColor }, children)
  );
}

/**
 * Badge - Tag/chip style component
 */
export function Badge({
  children,
  color = colors.secondary,
  variant = 'outline', // 'outline', 'filled'
}) {
  if (variant === 'filled') {
    return React.createElement(
      Text,
      { color, inverse: true },
      ` ${children} `
    );
  }
  
  return React.createElement(
    Text,
    { color },
    `[ ${children} ]`
  );
}

/**
 * CommandBox - Input box styled like terminal prompt
 */
export function CommandBox({
  prompt = 'root@dev:~$',
  command = '',
  cursorVisible = true,
  promptColor = colors.primary,
  commandColor = colors.secondary,
}) {
  return React.createElement(
    Box,
    {
      borderStyle: 'single',
      borderColor: colors.muted,
      paddingX: 1,
      paddingY: 0,
    },
    React.createElement(
      Box,
      { flexDirection: 'row', gap: 1 },
      React.createElement(Text, { color: promptColor, bold: true }, prompt),
      React.createElement(Text, { color: commandColor }, command),
      cursorVisible && React.createElement(Text, { color: colors.primary, inverse: true }, ' ')
    )
  );
}

/**
 * Button - Styled button component
 */
export function Button({
  children,
  selected = false,
  color = colors.primary,
}) {
  const brackets = selected ? ['[', ']'] : ['[', ']'];
  
  return React.createElement(
    Text,
    { 
      color, 
      bold: selected,
      inverse: selected,
    },
    `${brackets[0]} ${children.toUpperCase()} ${brackets[1]}`
  );
}
