interface TabNavigationProps {
  activeTab: 'projects' | 'prompts';
  onTabChange: (tab: 'projects' | 'prompts') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="mb-8">
      <div className="border-b border-gray-700/50 bg-gray-900/20 rounded-t-lg overflow-hidden">
        <nav className="flex">
          <button
            onClick={() => onTabChange('projects')}
            className={`relative px-8 py-4 font-semibold text-lg transition-all duration-200 border-r border-gray-700/30 ${
              activeTab === 'projects'
                ? 'bg-gray-800/60 text-white border-t-2 border-t-gray-300 border-l border-l-gray-600/50 border-r border-r-gray-600/50 shadow-lg z-10'
                : 'bg-gray-900/40 text-gray-400 hover:text-gray-300 hover:bg-gray-800/40 border-t-2 border-t-transparent'
            }`}
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-bold tracking-wide">PROJECTS</span>
            </span>
            {activeTab === 'projects' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 shadow-sm"></div>
            )}
          </button>
          
          <button
            onClick={() => onTabChange('prompts')}
            className={`relative px-8 py-4 font-semibold text-lg transition-all duration-200 border-r border-gray-700/30 ${
              activeTab === 'prompts'
                ? 'bg-gray-800/60 text-white border-t-2 border-t-gray-300 border-l border-l-gray-600/50 border-r border-r-gray-600/50 shadow-lg z-10'
                : 'bg-gray-900/40 text-gray-400 hover:text-gray-300 hover:bg-gray-800/40 border-t-2 border-t-transparent'
            }`}
          >
            <span className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-bold tracking-wide">PROMPTS</span>
            </span>
            {activeTab === 'prompts' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 shadow-sm"></div>
            )}
          </button>
          
          {/* Spacer to fill remaining width with background */}
          <div className="flex-1 bg-gray-900/20 border-t-2 border-t-transparent border-r border-gray-700/30"></div>
        </nav>
      </div>
    </div>
  );
}