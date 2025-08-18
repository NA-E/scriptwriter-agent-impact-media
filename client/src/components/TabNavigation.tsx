interface TabNavigationProps {
  activeTab: 'projects' | 'prompts';
  onTabChange: (tab: 'projects' | 'prompts') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-b border-gray-800 mb-8">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onTabChange('projects')}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'projects'
              ? 'border-gray-300 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
          }`}
        >
          Projects
        </button>
        <button
          onClick={() => onTabChange('prompts')}
          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'prompts'
              ? 'border-gray-300 text-white'
              : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
          }`}
        >
          Prompts
        </button>
      </nav>
    </div>
  );
}