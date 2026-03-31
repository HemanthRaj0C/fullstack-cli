import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import { getFrontendChoices, getBackendChoices, getDatabaseChoices } from '../../utils/stack.js';

export function SelectScreen({ onComplete, onCancel }) {
  const [step, setStep] = useState('frontend');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selections, setSelections] = useState({
    frontend: null,
    backend: null,
    database: null,
  });

  const frontendChoices = getFrontendChoices();
  const backendChoices = selections.frontend ? getBackendChoices(selections.frontend) : [];
  const databaseChoices = selections.backend ? getDatabaseChoices(selections.backend) : [];

  const getChoiceValue = (choice) => (typeof choice === 'string' ? choice : choice.value || choice.name);
  const getChoiceName = (choice) => (typeof choice === 'string' ? choice : choice.name);

  const handleSelect = (choiceValue) => {
    if (step === 'frontend') {
      setSelections({ frontend: choiceValue, backend: null, database: null });
      setSelectedIndex(0);
      setStep('backend');
    } else if (step === 'backend') {
      setSelections((prev) => ({ ...prev, backend: choiceValue, database: null }));
      setSelectedIndex(0);
      setStep('database');
    } else {
      const finalSelections = { ...selections, database: choiceValue };
      setSelections(finalSelections);
      onComplete(finalSelections);
    }
  };

  useInput((input, key) => {
    const choices = step === 'frontend' ? frontendChoices : step === 'backend' ? backendChoices : databaseChoices;

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : choices.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev < choices.length - 1 ? prev + 1 : 0));
    } else if (key.return) {
      const selectedChoice = choices[selectedIndex];
      handleSelect(getChoiceValue(selectedChoice));
    } else if (input === 'q' || key.escape) {
      onCancel();
    }
  });

  const choices = step === 'frontend' ? frontendChoices : step === 'backend' ? backendChoices : databaseChoices;

  const choiceElements = choices.map((choice, idx) => {
    const isSelected = idx === selectedIndex;
    const displayName = getChoiceName(choice);
    const prefix = isSelected ? '❯ ' : '  ';
    const color = isSelected ? 'cyan' : 'white';
    const bold = isSelected;

    return React.createElement(
      Text,
      { key: idx, color, bold },
      `${prefix}${idx + 1}. ${displayName}`
    );
  });

  return React.createElement(
    Box,
    { flexDirection: 'column', padding: 1 },
    React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(
        Text,
        { bold: true, color: 'cyan' },
        `Step ${step === 'frontend' ? '1' : step === 'backend' ? '2' : '3'} of 3: Select ${step.toUpperCase()}`
      )
    ),
    React.createElement(
      Box,
      { marginBottom: 1, flexDirection: 'column' },
      choiceElements
    ),
    React.createElement(
      Box,
      { marginTop: 1 },
      React.createElement(
        Text,
        { dimColor: true },
        '↑/↓ Navigate • Enter Select • Q Quit'
      )
    )
  );
}
