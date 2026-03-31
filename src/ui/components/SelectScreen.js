import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { useInput } from 'ink';
import { getFrontendChoices, getBackendChoices, getDatabaseChoices } from '../../utils/stack.js';
import { colors } from '../theme.js';

/**
 * SelectScreen - Clean selection wizard
 */
export function SelectScreen({ onComplete, onCancel, onSelectionChange }) {
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
      const newSelections = { frontend: choiceValue, backend: null, database: null };
      setSelections(newSelections);
      setSelectedIndex(0);
      setStep('backend');
      onSelectionChange?.(newSelections);
    } else if (step === 'backend') {
      const newSelections = { ...selections, backend: choiceValue, database: null };
      setSelections(newSelections);
      setSelectedIndex(0);
      setStep('database');
      onSelectionChange?.(newSelections);
    } else {
      const finalSelections = { ...selections, database: choiceValue };
      setSelections(finalSelections);
      onSelectionChange?.(finalSelections);
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
  const currentStep = step === 'frontend' ? 1 : step === 'backend' ? 2 : 3;

  // Get question text based on step
  const getQuestion = () => {
    switch (step) {
      case 'frontend':
        return 'Select Frontend Framework';
      case 'backend':
        return 'Select Backend Framework';
      case 'database':
        return 'Select Database';
      default:
        return 'Select Option';
    }
  };

  // Render choice items
  const choiceElements = choices.map((choice, idx) => {
    const isSelected = idx === selectedIndex;
    const displayName = getChoiceName(choice);
    
    return React.createElement(
      Box,
      { key: idx, flexDirection: 'row', marginY: 0 },
      React.createElement(
        Text,
        { color: isSelected ? colors.primary : colors.muted },
        isSelected ? '  ❯ ' : '    '
      ),
      React.createElement(
        Text,
        { 
          color: isSelected ? colors.primary : colors.text,
          bold: isSelected,
        },
        displayName
      )
    );
  });

  return React.createElement(
    Box,
    { flexDirection: 'column', width: '100%' },
    // Step indicator
    React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(
        Text,
        { color: colors.muted },
        `Step ${currentStep}/3`
      )
    ),
    // Question header
    React.createElement(
      Box,
      { marginBottom: 1 },
      React.createElement(
        Text,
        { color: colors.secondary, bold: true },
        `? ${getQuestion()}`
      )
    ),
    // Choice list
    React.createElement(
      Box,
      { flexDirection: 'column' },
      choiceElements
    )
  );
}
