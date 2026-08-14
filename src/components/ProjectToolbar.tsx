import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNew: () => void;
}

export const ProjectToolbar: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onOpenNew,
}) => {
  const { t } = useLanguage();

  return (
    <div className="toolbar">
      <input
        className="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t('searchPlaceholder')}
      />
      <button className="primary" onClick={onOpenNew}>
        {t('btnNewProject')}
      </button>
    </div>
  );
};

