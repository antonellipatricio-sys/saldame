import { useState, useEffect, useRef } from 'react';
import { useExpenseStore } from '@/store/useExpenseStore';
import { queryExpenses } from '@/lib/gemini';
import { MessageSquare, Send, Loader2, Sparkles, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    loading?: boolean;
}

const EXAMPLE_QUESTIONS = [
    '¿Cuánto gasté en Supermercado este mes?',
    '¿Cuánto debo de la tarjeta terminada en 1204?',
    '¿Cuáles fueron mis 5 gastos más altos?',
    '¿Cuánto gasté en dólares?',
    '¿Cuánto llevo gastado en total este mes?',
    '¿Qué categoría tiene más gastos?',
];

export function QueryPage() {
    const { expenses, categories, tags, fetchExpenses } = useExpenseStore();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isQuerying, setIsQuerying] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (question?: string) => {
        const q = (question ?? input).trim();
        if (!q || isQuerying) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: q,
        };

        const loadingMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: '',
            loading: true,
        };

        setMessages(prev => [...prev, userMsg, loadingMsg]);
        setInput('');
        setIsQuerying(true);

        try {
            const catNames = categories.map(c => c.name);
            const tagNames = tags.map(t => t.name);
            const answer = await queryExpenses(q, expenses, catNames, tagNames);

            setMessages(prev =>
                prev.map(m => m.id === loadingMsg.id ? { ...m, content: answer, loading: false } : m)
            );
        } catch {
            setMessages(prev =>
                prev.map(m =>
                    m.id === loadingMsg.id
                        ? { ...m, content: '❌ Error al procesar la consulta. Intentá de nuevo.', loading: false }
                        : m
                )
            );
        } finally {
            setIsQuerying(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Renderizar markdown básico
    const renderMarkdown = (text: string) => {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code class="bg-slate-200 px-1 rounded text-sm">$1</code>')
            .replace(/^### (.+)$/gm, '<h3 class="font-bold text-lg mt-3 mb-1">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 class="font-bold text-xl mt-3 mb-1">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 class="font-bold text-2xl mt-3 mb-1">$1</h1>')
            .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/\n/g, '<br />');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Consultas con IA</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Preguntá sobre tus gastos en lenguaje natural</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-sm">
                {messages.length === 0 ? (
                    // Estado vacío: mostrar preguntas de ejemplo
                    <div className="flex flex-col items-center justify-center h-full p-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-2xl flex items-center justify-center mb-4">
                            <MessageSquare className="w-8 h-8 text-violet-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-700 mb-2">¿Qué querés saber?</h2>
                        <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
                            Hacé preguntas sobre tus gastos y la IA te responde al instante.
                            Podés preguntar por categoría, tarjeta, período, o lo que necesites.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                            {EXAMPLE_QUESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSubmit(q)}
                                    className="flex items-center gap-2 text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-sm text-slate-600 hover:text-violet-700 group"
                                >
                                    <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-violet-500 shrink-0" />
                                    <span>{q}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={cn(
                                    'flex',
                                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                <div
                                    className={cn(
                                        'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white rounded-br-md'
                                            : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-md'
                                    )}
                                >
                                    {msg.loading ? (
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Analizando tus gastos...</span>
                                        </div>
                                    ) : msg.role === 'assistant' ? (
                                        <div
                                            className="prose prose-sm max-w-none prose-slate"
                                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                                        />
                                    ) : (
                                        <p>{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="mt-4">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Preguntá sobre tus gastos..."
                        disabled={isQuerying}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm bg-white disabled:opacity-50"
                        autoComplete="off"
                    />
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isQuerying}
                        className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-semibold hover:from-violet-600 hover:to-fuchsia-700 disabled:opacity-40 transition-all flex items-center gap-2"
                    >
                        {isQuerying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                    Powered by Gemini 2.0 Flash · {expenses.length} gastos cargados
                </p>
            </div>
        </div>
    );
}
