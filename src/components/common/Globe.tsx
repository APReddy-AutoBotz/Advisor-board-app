
import { extractFirstName } from '../../utils/nameUtils';

interface AdvisorBubble {
  id: string;
  name: string;
  initials: string;
  position: { x: number; y: number };
  delay: number;
}

interface GlobeProps {
  advisors?: AdvisorBubble[];
  className?: string;
}

export default function Globe({ advisors = [], className = '' }: GlobeProps) {
  // Default advisor bubbles if none provided
  const defaultAdvisors: AdvisorBubble[] = [
    { id: '1', name: 'Dr. Sarah Chen', initials: 'SC', position: { x: 20, y: 30 }, delay: 0 },
    { id: '2', name: 'Prof. Ahmed Hassan', initials: 'AH', position: { x: 80, y: 20 }, delay: 0.5 },
    { id: '3', name: 'Dr. Maria Rodriguez', initials: 'MR', position: { x: 15, y: 70 }, delay: 1 },
    { id: '4', name: 'Dr. James Wilson', initials: 'JW', position: { x: 85, y: 65 }, delay: 1.5 },
    { id: '5', name: 'Dr. Priya Patel', initials: 'PP', position: { x: 50, y: 15 }, delay: 2 },
    { id: '6', name: 'Dr. Robert Kim', initials: 'RK', position: { x: 60, y: 85 }, delay: 2.5 },
  ];

  const bubbles = advisors.length > 0 ? advisors : defaultAdvisors;

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Main Globe */}
      <div className="relative w-80 h-80 mx-auto">
        {/* Globe Base */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shadow-2xl">
          {/* Globe Grid Lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 320">
            {/* Vertical lines */}
            <path
              d="M160 20 Q160 160 160 300"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M80 40 Q160 160 240 280"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              fill="none"
            />
            <path
              d="M240 40 Q160 160 80 280"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              fill="none"
            />
            
            {/* Horizontal lines */}
            <ellipse
              cx="160"
              cy="160"
              rx="140"
              ry="40"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
              fill="none"
            />
            <ellipse
              cx="160"
              cy="160"
              rx="120"
              ry="25"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              fill="none"
            />
            <ellipse
              cx="160"
              cy="160"
              rx="100"
              ry="15"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              fill="none"
            />
          </svg>

          {/* Globe Highlight */}
          <div className="absolute top-8 left-12 w-16 h-16 bg-white opacity-20 rounded-full blur-xl"></div>
        </div>

        {/* Floating Advisor Bubbles */}
        {bubbles.map((advisor) => (
          <div
            key={advisor.id}
            className="absolute animate-float"
            style={{
              left: `${advisor.position.x}%`,
              top: `${advisor.position.y}%`,
              animationDelay: `${advisor.delay}s`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Chat Bubble */}
            <div className="relative group">
              {/* Bubble Content */}
              <div className="bg-white rounded-lg shadow-lg p-3 min-w-[120px] transform hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-2">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {advisor.initials}
                  </div>
                  {/* Message */}
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 font-medium">
                      {extractFirstName(advisor.name)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Ready to help
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bubble Tail */}
              <div className="absolute -bottom-1 left-4 w-3 h-3 bg-white transform rotate-45 shadow-lg"></div>
              
              {/* Tooltip on Hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                {advisor.name}
              </div>
            </div>
          </div>
        ))}

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden rounded-full">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-ping"
              style={{
                left: `${20 + (i * 10)}%`,
                top: `${30 + (i * 7)}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: '3s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
