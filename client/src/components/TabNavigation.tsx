import { useRef, useEffect, useState } from 'react'

interface TabNavigationProps {
  activeTab: 'projects' | 'prompts';
  onTabChange: (tab: 'projects' | 'prompts') => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const projectsRef = useRef<HTMLButtonElement>(null)
  const promptsRef = useRef<HTMLButtonElement>(null)

  const updateIndicator = () => {
    const activeRef = activeTab === 'projects' ? projectsRef : promptsRef
    const activeElement = activeRef.current
    
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement
      setIndicatorStyle({
        left: offsetLeft,
        width: offsetWidth
      })
    }
  }

  useEffect(() => {
    // Update indicator on mount and when active tab changes
    updateIndicator()
  }, [activeTab])

  return (
    <div className="mb-8">
      <div className="relative">
        <div className="flex space-x-8">
          <button
            ref={projectsRef}
            onClick={() => onTabChange('projects')}
            className={`
              px-4 py-3 font-bold text-sm uppercase tracking-wider transition-colors duration-200 flex items-center gap-3
              ${activeTab === 'projects' 
                ? 'text-white' 
                : 'text-gray-400 hover:text-gray-300'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="font-bold tracking-wide">PROJECTS</span>
          </button>
          <button
            ref={promptsRef}
            onClick={() => onTabChange('prompts')}
            className={`
              px-4 py-3 font-bold text-sm uppercase tracking-wider transition-colors duration-200 flex items-center gap-3
              ${activeTab === 'prompts' 
                ? 'text-white' 
                : 'text-gray-400 hover:text-gray-300'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-bold tracking-wide">PROMPTS</span>
          </button>
        </div>
        
        {/* Full-width horizontal line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-700/50"></div>
        
        {/* Animated Selection Indicator */}
        <div 
          className="absolute bottom-0 h-0.5 bg-white transition-all duration-300 ease-out z-10"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`
          }}
        />
      </div>
    </div>
  );
}