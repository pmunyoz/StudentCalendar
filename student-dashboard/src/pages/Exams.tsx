
import { ChevronLeft, ChevronRight, Bell, Filter, Check, X } from 'lucide-react';

/**
 * Filter checkbox component for the calendar sidebar
 * Displays a custom colored checkbox with a label
 */
function FilterCheckbox({ color, label, checked }: { color: string, label: string, checked: boolean }) {
    // Define color map manually to avoid Tailwind CSS purge issues
    const styles = {
        red: { bg: 'bg-red-500', border: 'border-red-500', dot: 'bg-red-500' },
        blue: { bg: 'bg-blue-600', border: 'border-blue-600', dot: 'bg-blue-600' },
        green: { bg: 'bg-green-500', border: 'border-green-500', dot: 'bg-green-500' },
    }[color as 'red' | 'blue' | 'green'];

    const textColor = checked ? 'text-white' : 'text-transparent';
    const checkedBg = checked ? `${styles.bg} ${styles.border}` : 'bg-transparent border-slate-300';

    return (
        <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${checkedBg}`}>
                    <Check size={14} className={textColor} strokeWidth={3} />
                </div>
                <span className="text-slate-700 font-bold">{label}</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
        </div>
    );
}

/**
 * Event pill component for calendar grid
 * Displays a colored event tag inside a calendar day cell
 */
function EventPill({ title, color }: { title: string, color: 'red' | 'blue' | 'green' }) {
    const styles = {
        red: 'bg-red-100/80 text-red-700 w-full',
        blue: 'bg-blue-200 text-blue-800 shadow-sm w-[90%]', // Logic Lab matches this look
        green: 'bg-green-100/80 text-green-700 w-full',
    }[color];

    // Specific tweak: if the event is "Logic Lab", the text color might be slightly different
    const bgBlueVariant = title === 'Logic Lab' ? 'bg-blue-200 text-blue-700' : (color === 'blue' ? 'bg-blue-100 text-blue-600 w-[90%]' : styles);

    return (
        <div className={`text-[11px] font-bold px-2 py-1 rounded select-none mb-1 truncate ${bgBlueVariant === styles ? styles : bgBlueVariant}`}>
            {title}
        </div>
    );
}

/**
 * Deadline card component for sidebar
 * Shows upcoming tasks with a colored accent margin
 */
function DeadlineCard({ time, title, desc, color }: { time: string, title: string, desc: string, color: 'red' | 'blue' | 'green' }) {
    const styles = {
        red: 'border-l-red-500 bg-red-50/50 text-red-600',
        blue: 'border-l-blue-500 bg-blue-50/50 text-blue-600',
        green: 'border-l-green-500 bg-green-50/50 text-green-600',
    }[color];

    return (
        <div className={`border-l-4 rounded-r-xl p-3 ${styles.split(' bg')[0]} ${styles.split(' ')[1]} mb-3`}>
            <div className={`text-xs font-black uppercase tracking-wider mb-1 ${styles.split(' ')[2]}`}>{time}</div>
            <div className="font-bold text-slate-800 text-[13px]">{title}</div>
            <div className="text-xs text-slate-500 mt-1">{desc}</div>
        </div>
    );
}

/**
 * Página principal del calendario de exámenes basada en el diseño interactivo
 */
export default function ExamsPage() {
    // Array with all days to show in the calendar layout.
    // In March 2024, the 1st is Friday. Therefore, Sun-Thu are Feb 25-29.
    const days = [
        { date: '25', currentMonth: false }, { date: '26', currentMonth: false }, { date: '27', currentMonth: false }, { date: '28', currentMonth: false }, { date: '29', currentMonth: false }, { date: '1', currentMonth: true }, { date: '2', currentMonth: true },
        { date: '3', currentMonth: true }, { date: '4', currentMonth: true }, { date: '5', currentMonth: true, isToday: true }, { date: '6', currentMonth: true }, { date: '7', currentMonth: true }, { date: '8', currentMonth: true }, { date: '9', currentMonth: true },
        { date: '10', currentMonth: true }, { date: '11', currentMonth: true }, { date: '12', currentMonth: true }, { date: '13', currentMonth: true }, { date: '14', currentMonth: true }, { date: '15', currentMonth: true }, { date: '16', currentMonth: true },
        { date: '17', currentMonth: true }, { date: '18', currentMonth: true }, { date: '19', currentMonth: true }, { date: '20', currentMonth: true }, { date: '21', currentMonth: true }, { date: '22', currentMonth: true }, { date: '23', currentMonth: true },
        { date: '24', currentMonth: true }, { date: '25', currentMonth: true }, { date: '26', currentMonth: true }, { date: '27', currentMonth: true }, { date: '28', currentMonth: true }, { date: '29', currentMonth: true }, { date: '30', currentMonth: true },
    ];

    /**
     * Retorna la lista de eventos dados el día y si pertenece al mes actual
     */
    const getEventsForDay = (day: string, currentMonth: boolean) => {
        if (!currentMonth) return [];
        if (day === '1') return [{ title: 'Assignment 1', color: 'blue' as const }];
        if (day === '4') return [{ title: 'History Quiz', color: 'red' as const }, { title: 'Drafting Design', color: 'green' as const }];
        if (day === '5') return [{ title: 'Logic Lab', color: 'blue' as const }];
        if (day === '7') return [{ title: 'Calculus Exam', color: 'red' as const }];
        if (day === '12') return [{ title: 'AI Project Final', color: 'green' as const }];
        if (day === '14') return [{ title: 'Essay Due', color: 'blue' as const }];
        return [];
    };

    return (
        <div className="flex flex-col xl:flex-row bg-white overflow-hidden h-full min-h-[85vh] animate-in fade-in duration-500">
            {/* Sidebar (Left Panel) */}
            <aside className="w-full xl:w-72 border-r border-slate-200 flex flex-col pt-0 pb-6 pr-6 xl:pl-2 bg-white shrink-0">
                {/* Filters */}
                <div className="mb-8 pt-4">
                    <h3 className="flex items-center gap-3 font-black text-slate-800 mb-6 text-sm">
                        <Filter className="text-blue-500" size={18} /> Task Filters
                    </h3>
                    <div className="space-y-5 px-1">
                        <FilterCheckbox color="red" label="Exams" checked={true} />
                        <FilterCheckbox color="blue" label="Exercises" checked={true} />
                        <FilterCheckbox color="green" label="Projects" checked={true} />
                    </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="mb-8 mt-2">
                    <h3 className="flex items-center gap-3 font-black text-slate-800 mb-5 text-sm">
                        <Bell className="text-blue-500" size={18} /> Upcoming Deadlines
                    </h3>
                    <div className="space-y-0">
                        <DeadlineCard color="red" time="Tomorrow" title="Advanced Calculus Exam" desc="Room 402 • 09:00 AM" />
                        <DeadlineCard color="blue" time="In 3 Days" title="Physics Lab Report" desc="Online Submission" />
                        <DeadlineCard color="green" time="Next Week" title="AI Semester Project" desc="Group Presentation" />
                    </div>
                </div>

                <div className="mt-4">
                    {/* Progress */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                        <h4 className="text-xs font-black text-blue-600 uppercase tracking-wider mb-3">Semester Progress</h4>
                        <div className="w-full bg-slate-200/80 rounded-full h-2.5 mb-3 overflow-hidden">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                        <span className="text-xs font-medium text-slate-500">75% Completed</span>
                    </div>
                </div>
            </aside>

            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col relative w-full pt-4 xl:pt-0 xl:pl-6">
                {/* Calendar Header */}
                <header className="h-16 flex items-center justify-between pb-4">
                    <div className="flex items-center gap-8">
                        <h2 className="text-[28px] font-black text-slate-900 tracking-tight leading-none h-auto -mt-1">March 2024</h2>
                        <div className="flex items-center font-bold text-sm">
                            <button className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600 mr-2">
                                <ChevronLeft size={18} strokeWidth={2.5} />
                            </button>
                            <span className="px-1 text-slate-900">Today</span>
                            <button className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-600 ml-2">
                                <ChevronRight size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>

                    <div className="hidden sm:flex bg-slate-50 p-1 border border-slate-200/80 rounded-xl">
                        <button className="px-5 py-1.5 text-[13px] font-bold rounded-lg text-slate-600 hover:text-slate-900 transition-colors">Day</button>
                        <button className="px-5 py-1.5 text-[13px] font-bold rounded-lg text-slate-600 hover:text-slate-900 transition-colors">Week</button>
                        <button className="px-5 py-1.5 text-[13px] font-bold rounded-lg bg-white text-blue-600 shadow-sm border border-slate-200/50">Month</button>
                    </div>
                </header>

                <div className="border border-slate-200 flex-1 flex flex-col rounded-xl overflow-hidden bg-white mb-2">
                    {/* Calendar Grid Header */}
                    <div className="grid grid-cols-7 border-b border-slate-200 bg-white shadow-sm z-10">
                        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                            <div key={day} className="py-3 text-center text-xs font-black text-slate-400 tracking-widest border-r border-slate-200 last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-white">
                        {days.map((dayObj, index) => {
                            const events = getEventsForDay(dayObj.date, dayObj.currentMonth);
                            return (
                                <div key={index} className={`border-r border-b border-slate-200 p-2 min-h-[110px] xl:min-h-[130px] bg-white transition-colors hover:bg-slate-50/50 flex flex-col ${index % 7 === 6 ? 'border-r-0' : ''}`}>
                                    <div className="mb-2.5 font-bold">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[13px] ${dayObj.isToday ? 'bg-blue-600 text-white' : (dayObj.currentMonth ? 'text-slate-800' : 'text-slate-400')}`}>
                                            {dayObj.date}
                                        </span>
                                    </div>
                                    <div className="space-y-[3px] flex-1">
                                        {events.map((evt, idx) => (
                                            <EventPill key={idx} title={evt.title} color={evt.color} />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Popup Summary Panel for March 5 */}
                <div className="absolute right-8 bottom-8 z-50 w-[300px] bg-white rounded-xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden hidden xl:block animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-blue-600 px-4 py-3 flex justify-between items-center">
                        <h4 className="text-white font-bold text-[13px]">Summary: March 5</h4>
                        <button className="text-blue-100 hover:text-white transition-colors"><X size={16} /></button>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0 relative">
                                <div className="absolute inset-0 rounded-full ring-4 ring-blue-100"></div>
                            </div>
                            <div>
                                <div className="font-bold text-slate-800 text-[13px] leading-tight">Logic Lab Exercises</div>
                                <div className="text-[11px] text-slate-500 mt-1">2:00 PM - 4:00 PM</div>
                            </div>
                        </div>
                        <div className="flex gap-3 text-slate-400">
                            <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                            <div>
                                <div className="font-bold text-[13px] line-through decoration-slate-300 leading-tight text-slate-400">Reading Assignment</div>
                                <div className="text-[11px] mt-1 text-slate-400">Completed at 10:30 AM</div>
                            </div>
                        </div>
                        <button className="w-full mt-3 py-2 border border-blue-100 rounded-lg text-xs font-black text-blue-600 hover:bg-blue-50 transition-colors">
                            View Day Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
