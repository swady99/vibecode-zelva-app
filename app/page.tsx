"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MessageRole = "assistant" | "user";

type ExpenseCategory =
  | "food"
  | "coffee"
  | "groceries"
  | "transport"
  | "travel"
  | "tickets"
  | "cinema"
  | "subscriptions"
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
  travel: ["flight", "train", "plane", "hotel", "airbnb", "airport", "travel"],
  tickets: ["ticket", "tickets", "pass", "fare"],
  cinema: ["movie", "cinema", "film", "theater", "theatre", "imax"],
  subscriptions: ["subscription", "netflix", "spotify", "prime", "disney", "apple", "sub"],
  shopping: ["shopping", "shirt", "shoes", "clothes", "store", "bought"],
  other: [],
};

const INITIAL_MESSAGES: ChatMessageData[] = [];

function normalizeCurrency(input: string) {
  const normalizedInput = input.trim().toLowerCase();

  if (["kr", "krs", "sek", "krona", "kronor"].includes(normalizedInput)) {
    return "SEK";
  }

  return input.toUpperCase();
}

function formatAmount(amount: number, currency: string) {
  const normalizedCurrency = normalizeCurrency(currency);

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

  const currencyMatch = input.match(/\b(sek|kr|krs|krona|kronor|[A-Za-z]{3})\b/i);
  const currency = currencyMatch ? normalizeCurrency(currencyMatch[1]) : "SEK";
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
  _categoryCounts: Record<ExpenseCategory, number>,
  nextXp: number,
  nextStreak: number,
) {
  if (!parsedExpense) {
    return ['I missed the amount there. Try "Spent 120 SEK on lunch".'];
  }

  const { amount, currency, category } = parsedExpense;
  const formattedAmount = formatAmount(amount, currency);
  const formattedTotal = formatAmount(dailyTotal, currency);
  const pick = (options: string[]) => options[Math.floor(Math.random() * options.length)];

  const withExtras = (main: string) => {
    let extra: string | null = null;

    const useXp = Math.random() < 0.35;
    const useStreak = !useXp && nextStreak > 0 && Math.random() < 0.35;

    if (useXp) {
      const xpSnippets = [
        "+5 XP—consistent logging",
        "+5 XP. Nice and steady.",
        "+5 XP. Little steps count.",
      ];
      extra = pick(xpSnippets);
    } else if (useStreak) {
      const streakSnippets = [
        `${nextStreak} day streak. Keep it warm 🔥`,
        `${nextStreak} days in a row—love the habit`,
        `Streak at ${nextStreak}. Stay in rhythm.`,
      ];
      extra = pick(streakSnippets);
    }

    return [extra ? `${main} ${extra}` : main];
  };

  if (category === "coffee") {
    const templates = [
      `Coffee #${similarExpenseCount} today. Easy on the espresso ☕️`,
      `Coffee again? Sneaky one ☕️`,
      `Caffeine meter is climbing ☕️`,
    ];
    const main = `${pick(templates)} You’re at ${formattedTotal} today.`;
    return withExtras(main);
  }

  if (category === "food") {
    const templates = [
      `Food #${similarExpenseCount} today—looks tasty 🍽️`,
      `Good choice. ${formattedAmount} on food.`,
      `Fueling up. ${formattedAmount}.`,
    ];
    const main = `${pick(templates)} You’re at ${formattedTotal} today.`;
    return withExtras(main);
  }

  if (category === "groceries") {
    const templates = [
      `Groceries sorted. ${formattedAmount}.`,
      `Pantry wins. ${formattedAmount}.`,
      `Restock done. ${formattedAmount}.`,
    ];
    const main = `${pick(templates)} Total: ${formattedTotal}.`;
    return withExtras(main);
  }

  if (category === "transport") {
    const templates = [
      `${formattedAmount} to get around.`,
      `Ride covered: ${formattedAmount}.`,
      `Transit spend: ${formattedAmount}.`,
    ];
    const main = `${pick(templates)} Total is ${formattedTotal}.`;
    return withExtras(main);
  }

  if (category === "shopping") {
    const templates = [
      `Shopping vibe today 👀 ${formattedAmount}.`,
      `A little treat? ${formattedAmount}.`,
      `Retail therapy approved. ${formattedAmount}.`,
    ];
    const main = `${pick(templates)} Total now ${formattedTotal}.`;
    return withExtras(main);
  }

  if (category === "travel") {
    const templates = [
      `Travel mode on ✈️ ${formattedAmount}.`,
      `Trip spend: ${formattedAmount}.`,
      `Adventure fund: ${formattedAmount}.`,
    ];
    const main = `${pick(templates)} Total is ${formattedTotal}.`;
    return withExtras(main);
  }

  if (category === "tickets") {
    const templates = [
      `Tickets sorted. ${formattedAmount}.`,
      `Seat secured for ${formattedAmount}.`,
      `Ticket spend: ${formattedAmount}.`,
    ];
    const main = `${pick(templates)} You’re at ${formattedTotal} today.`;
    return withExtras(main);
  }

  if (category === "cinema") {
    const templates = [
      `Movie time 🎬 ${formattedAmount}.`,
      `Cinema night for ${formattedAmount}.`,
      `Film fix: ${formattedAmount}.`,
    ];
    const main = `${pick(templates)} Total today ${formattedTotal}.`;
    return withExtras(main);
  }

  if (category === "subscriptions") {
    const templates = [
      `Sub renewed: ${formattedAmount}.`,
      `${formattedAmount} on subs. Worth it?`,
      `Keeping the subs rolling: ${formattedAmount}.`,
    ];
    const main = `${pick(templates)} Running total ${formattedTotal}.`;
    return withExtras(main);
  }

  if (dailyTotal >= 200) {
    const templates = [
      `${formattedAmount}. You’ve crossed ${formattedTotal} today.`,
      `${formattedAmount}. Total sits at ${formattedTotal}.`,
      `${formattedAmount}. You’re already at ${formattedTotal}.`,
    ];
    return withExtras(pick(templates));
  }

  const templates = [
    `${formattedAmount}. Total so far ${formattedTotal}.`,
    `${formattedAmount}. You’re at ${formattedTotal}.`,
    `${formattedAmount}. Running total ${formattedTotal}.`,
  ];
  return withExtras(pick(templates));
}

function AppHeader() {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pb-1 pt-3 sm:pt-4">
      <div className="min-w-0" />

      <div className="text-center">
        <p className="font-brand text-[1.75rem] tracking-[0.22em] text-white sm:text-[1.9rem]">ZELVA</p>
      </div>

      <div className="flex items-center justify-end">
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
      </div>
    </header>
  );
}

function HeaderStats({ streak, xp, dailyTotal }: { streak: number; xp: number; dailyTotal: number }) {
  return (
    <div className="px-4 pb-3">
      <div className="flex items-center justify-between rounded-full bg-[#111113] px-3 py-2 text-[12px] text-[#D1D1D6] sm:px-4">
        <span>🔥 {streak} streak</span>
        <span>⚡ {xp} XP</span>
        <span>💰 {formatAmount(dailyTotal, "SEK")}</span>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} px-1`}>
      <div
        className={`max-w-[82%] sm:max-w-[75%] rounded-[20px] px-4 py-3 text-[15px] leading-[1.45] shadow-[0_10px_24px_rgba(0,0,0,0.18)] ${
          isUser ? "rounded-br-lg bg-[#0A84FF] text-white" : "rounded-bl-lg bg-[#1C1C1E] text-white"
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
      className="sticky bottom-0 left-0 right-0 border-t border-white/5 bg-black/95 px-3 pb-[max(1.1rem,env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur"
    >
      <div className="flex items-end gap-2 rounded-[26px] bg-[#1C1C1E] px-3 py-2 sm:gap-3 sm:rounded-[28px]">
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
          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A84FF] text-white transition-opacity disabled:opacity-60 sm:h-12 sm:w-12"
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
  const [categoryCounts, setCategoryCounts] = useState<Record<ExpenseCategory, number>>({
    food: 0,
    coffee: 0,
    groceries: 0,
    transport: 0,
    travel: 0,
    tickets: 0,
    cinema: 0,
    subscriptions: 0,
    shopping: 0,
    other: 0,
  });

  const nextMessageId = useRef(2);
  const chatViewportRef = useRef<HTMLDivElement>(null);
  const hasSentCheckIn = useRef(false);

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

  useEffect(() => {
    if (hasSentCheckIn.current) return;

    hasSentCheckIn.current = true;
    const hasExpenses = expenseMessages.length > 0;
    const checkInMessage: ChatMessageData = {
      id: nextMessageId.current++,
      role: "assistant",
      text: hasExpenses
        ? `You're at ${formatAmount(dailyTotal, "SEK")} today. Anything else?`
        : "What did you spend today?",
    };

    setMessages([checkInMessage]);
  }, [dailyTotal, expenseMessages.length]);

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
    const nextStreak = parsedExpense ? (streak === 0 ? 1 : streak) : streak;
    const nextXp = parsedExpense ? xp + 5 : xp;

    if (parsedExpense) {
      setDailyTotal(nextDailyTotal);
      setXp(nextXp);
      setStreak(nextStreak);
      setCategoryCounts((current) => ({
        ...current,
        [parsedExpense.category]: (current[parsedExpense.category] ?? 0) + 1,
      }));
    }

    const assistantMessages = buildAssistantResponse(
      parsedExpense,
      similarExpenseCount,
      nextDailyTotal,
      categoryCounts,
      nextXp,
      nextStreak,
    ).map((line) => ({
      id: nextMessageId.current++,
      role: "assistant" as const,
      text: line,
    }));

    window.setTimeout(() => {
      setMessages((currentMessages) => [...currentMessages, ...assistantMessages]);
      setIsPendingReply(false);
    }, 420);
  };

  return (
    <main className="flex min-h-screen justify-center bg-black text-white">
      <div className="flex min-h-screen w-full max-w-md flex-col bg-black sm:max-w-[480px]">
        <AppHeader />
        <HeaderStats streak={streak} xp={xp} dailyTotal={dailyTotal} />

        <div
          ref={chatViewportRef}
          className="flex-1 space-y-3 overflow-y-auto px-3 pb-4 pt-2 sm:space-y-4 sm:px-4 sm:pb-6 sm:pt-3"
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
