"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MessageRole = "assistant" | "user";

type ExpenseCategory =
  | "food"
  | "coffee"
  | "groceries"
  | "transport"
  | "shopping"
  | "other";

type ParsedExpense = {
  amount: number;
  currency: string;
  category: ExpenseCategory;
};

type ChatMessageData = {
  id: number;
  role: MessageRole;
  text: string;
  parsedExpense?: ParsedExpense;
};

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  food: ["lunch", "dinner", "breakfast", "meal", "food", "snack", "restaurant"],
  coffee: ["coffee", "latte", "espresso", "cappuccino", "tea"],
  groceries: ["groceries", "grocery", "supermarket", "market", "milk", "bread"],
  transport: ["uber", "taxi", "train", "bus", "metro", "fuel", "gas", "parking"],
  shopping: ["shopping", "shirt", "shoes", "clothes", "store", "bought"],
  other: [],
};

const INITIAL_MESSAGES: ChatMessageData[] = [
  {
    id: 1,
    role: "assistant",
    text: "Ready when you are. Log an expense like “Spent 120 SEK on lunch”.",
  },
];

function formatAmount(amount: number, currency: string) {
  const normalizedCurrency = currency.toUpperCase();

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${normalizedCurrency}`;
  }
}

function parseExpense(input: string): ParsedExpense | null {
  const amountMatch = input.match(/(\d+(?:[.,]\d{1,2})?)/);

  if (!amountMatch) {
    return null;
  }

  const amount = Number(amountMatch[1].replace(",", "."));

  if (Number.isNaN(amount)) {
    return null;
  }

  const currencyMatch = input.match(/\b([A-Za-z]{3})\b/);
  const currency = currencyMatch ? currencyMatch[1].toUpperCase() : "SEK";
  const normalizedInput = input.toLowerCase();

  const category =
    (Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) =>
      keywords.some((keyword) => normalizedInput.includes(keyword)),
    )?.[0] as ExpenseCategory | undefined) ?? "other";

  return {
    amount,
    currency,
    category,
  };
}

function buildAssistantResponse(
  parsedExpense: ParsedExpense | null,
  similarExpenseCount: number,
  dailyTotal: number,
) {
  if (!parsedExpense) {
    return "I couldn’t spot the amount there. Try something like “Spent 120 SEK on lunch”.";
  }

  const { amount, currency, category } = parsedExpense;
  const formattedAmount = formatAmount(amount, currency);
  const formattedTotal = formatAmount(dailyTotal, currency);

  if (category === "coffee") {
    if (similarExpenseCount >= 2) {
      return `Coffee run number ${similarExpenseCount} today. You’re at ${formattedTotal} so far.`;
    }

    return `Logged ${formattedAmount} for coffee. Small spend, but they add up.`;
  }

  if (category === "food") {
    if (similarExpenseCount === 2) {
      return `That’s your second food expense today. Total is ${formattedTotal}.`;
    }

    return `Food spend noted. You’re at ${formattedTotal} today already.`;
  }

  if (category === "groceries") {
    return `Groceries logged. ${formattedTotal} spent today so far.`;
  }

  if (category === "transport") {
    return `Transport logged. ${formattedAmount} added, total now ${formattedTotal}.`;
  }

  if (category === "shopping") {
    return `Shopping noted. Keep an eye on it, you’re at ${formattedTotal} today.`;
  }

  if (dailyTotal >= 200) {
    return `Logged ${formattedAmount}. You’re at ${formattedTotal} today already.`;
  }

  return `Saved ${formattedAmount}. Clean log, and your total is now ${formattedTotal}.`;
}

function AppHeader({
  streak,
  xp,
}: {
  streak: number;
  xp: number;
}) {
  return (
    <header className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-lg font-semibold tracking-tight text-white">Zelva</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-[#8E8E93]">
          <span>🔥 {streak} day streak</span>
          <span>⚡ {xp} XP</span>
        </div>
      </div>
      <button
        type="button"
        aria-label="Settings"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E] text-[#8E8E93] transition-colors hover:text-white"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3.75v2.5m0 11.5v2.5m8.25-8.25h-2.5M6.25 12h-2.5m12.084-5.834-1.768 1.768M8.934 15.066l-1.768 1.768m8.668 0-1.768-1.768M8.934 8.934 7.166 7.166M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </button>
    </header>
  );
}

function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] rounded-[22px] px-4 py-3 text-[15px] leading-6 shadow-[0_6px_18px_rgba(0,0,0,0.18)] ${
          isUser ? "rounded-br-md bg-[#0A84FF] text-white" : "rounded-bl-md bg-[#1C1C1E] text-white"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}

function ChatInput({
  value,
  onChange,
  onSubmit,
  isPending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="border-t border-white/5 bg-black/95 px-4 pb-5 pt-3 backdrop-blur"
    >
      <div className="flex items-end gap-3 rounded-[28px] bg-[#1C1C1E] px-3 py-2">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Spent 120 SEK on lunch"
          className="h-11 flex-1 bg-transparent px-2 text-[15px] text-white outline-none placeholder:text-[#8E8E93]"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={isPending}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A84FF] text-white transition-opacity disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M4.47 3.85a.75.75 0 0 1 .79-.08l13.5 7.13a1.25 1.25 0 0 1 0 2.2L5.26 20.23A.75.75 0 0 1 4.2 19.5l1.12-5.34a.75.75 0 0 1 .55-.57l5.14-1.34-5.14-1.34a.75.75 0 0 1-.55-.57L4.2 4.5a.75.75 0 0 1 .27-.65Z" />
          </svg>
        </button>
      </div>
    </form>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageData[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [dailyTotal, setDailyTotal] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPendingReply, setIsPendingReply] = useState(false);

  const nextMessageId = useRef(2);
  const chatViewportRef = useRef<HTMLDivElement>(null);

  const expenseMessages = useMemo(
    () => messages.filter((message) => message.parsedExpense),
    [messages],
  );

  useEffect(() => {
    chatViewportRef.current?.scrollTo({
      top: chatViewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue || isPendingReply) {
      return;
    }

    const parsedExpense = parseExpense(trimmedValue);
    const userMessage: ChatMessageData = {
      id: nextMessageId.current++,
      role: "user",
      text: trimmedValue,
      parsedExpense: parsedExpense ?? undefined,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInputValue("");
    setIsPendingReply(true);

    const similarExpenseCount = parsedExpense
      ? expenseMessages.filter(
          (message) => message.parsedExpense?.category === parsedExpense.category,
        ).length + 1
      : 0;

    const nextDailyTotal = parsedExpense ? dailyTotal + parsedExpense.amount : dailyTotal;

    if (parsedExpense) {
      setDailyTotal(nextDailyTotal);
      setXp((currentXp) => currentXp + 5);
      setStreak((currentStreak) => (currentStreak === 0 ? 1 : currentStreak));
    }

    const assistantMessage: ChatMessageData = {
      id: nextMessageId.current++,
      role: "assistant",
      text: buildAssistantResponse(parsedExpense, similarExpenseCount, nextDailyTotal),
    };

    window.setTimeout(() => {
      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
      setIsPendingReply(false);
    }, 500);
  };

  return (
    <main className="flex min-h-screen justify-center bg-black text-white">
      <div className="flex min-h-screen w-full max-w-md flex-col bg-black">
        <AppHeader streak={streak} xp={xp} />

        <section className="px-4 pb-3">
          <div className="rounded-[24px] bg-[#111113] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#8E8E93]">Today</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="text-3xl font-semibold tracking-tight text-white">
                  {formatAmount(dailyTotal, "SEK")}
                </p>
                <p className="mt-1 text-sm text-[#8E8E93]">Daily total</p>
              </div>
              <p className="text-right text-sm text-[#8E8E93]">
                {expenseMessages.length} logged
              </p>
            </div>
          </div>
        </section>

        <div
          ref={chatViewportRef}
          className="flex-1 space-y-3 overflow-y-auto px-4 pb-6 pt-2"
        >
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
        </div>

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          isPending={isPendingReply}
        />
      </div>
    </main>
  );
}
