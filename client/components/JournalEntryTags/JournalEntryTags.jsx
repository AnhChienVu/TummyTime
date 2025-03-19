import React from 'react';
import styles from './JournalEntryTags.module.css';

// Predefined tags list
const PREDEFINED_TAGS = [
  'personal',
  'work',
  'health',
  'family',
  'goals',
  'gratitude',
  'reflection',
  'ideas',
  'memories',
  'achievements'
];

const JournalEntryTags = ({ selectedTags, setTags, disabled = false }) => {
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setTags(selectedTags.filter(t => t !== tag));
    } else {
      setTags([...selectedTags, tag]);
    }
  };

  return (
    <div className={styles.tagContainer}>
      <div className={styles.tagList}>
        {PREDEFINED_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagToggle(tag)}
            className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagSelected : ''}`}
            disabled={disabled}
            type="button"
          >
            #{tag}
          </button>
        ))}
      </div>
    </div>
  );
};

export default JournalEntryTags;