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
    text: 'Ready when you are. Try "Spent 120 SEK on lunch".',
  },
];

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
) {
  if (!parsedExpense) {
    return 'I missed the amount there. Try "Spent 120 SEK on lunch".';
  }

  const { amount, currency, category } = parsedExpense;
  const formattedAmount = formatAmount(amount, currency);
  const formattedTotal = formatAmount(dailyTotal, currency);
  const pick = (options: string[]) => options[Math.floor(Math.random() * options.length)];

  if (category === "coffee") {
    const templates = [
      `Another coffee? (${similarExpenseCount} today). Caffeine level rising ☕️. Total’s ${formattedTotal}.`,
      `${formattedAmount} for coffee. I’ll allow it—just keep an eye on that drip. Total: ${formattedTotal}.`,
      `Coffee logged. Pace yourself, barista-in-training. You’re at ${formattedTotal} today.`,
    ];
    return pick(templates);
  }

  if (category === "food") {
    const templates = [
      `${formattedAmount} for food—treat yourself 🍽️. Total so far: ${formattedTotal}.`,
      `Fueling up. That’s food #${similarExpenseCount} today. Total’s ${formattedTotal}.`,
      `Nice pick. ${formattedAmount} on food. You’re sitting at ${formattedTotal} today.`,
    ];
    return pick(templates);
  }

  if (category === "groceries") {
    const templates = [
      `Groceries in the bag. Running total: ${formattedTotal}.`,
      `Stocked up. You’re at ${formattedTotal} today.`,
      `${formattedAmount} on groceries. Pantry is happy; total is ${formattedTotal}.`,
    ];
    return pick(templates);
  }

  if (category === "transport") {
    const templates = [
      `${formattedAmount} on getting around. Today’s total is ${formattedTotal}.`,
      `Ride logged. You’re at ${formattedTotal} for the day.`,
      `${formattedAmount} for transport. Total stands at ${formattedTotal}.`,
    ];
    return pick(templates);
  }

  if (category === "shopping") {
    const templates = [
      `${formattedAmount} on shopping. Treat yo’ self—total is ${formattedTotal}.`,
      `Shopping spree noted 👀 Total today: ${formattedTotal}.`,
      `Retail therapy logged. You’re at ${formattedTotal} now.`,
    ];
    return pick(templates);
  }

  if (dailyTotal >= 200) {
    const templates = [
      `${formattedAmount}. You’ve crossed ${formattedTotal} today—nice momentum.`,
      `${formattedAmount} logged. Totals sit at ${formattedTotal}.`,
      `Saved it. You’re now at ${formattedTotal} today.`,
    ];
    return pick(templates);
  }

  const templates = [
    `${formattedAmount} saved. Total so far: ${formattedTotal}.`,
    `${formattedAmount}. Easy. You’re sitting at ${formattedTotal}.`,
    `${formattedAmount} logged. Running total is ${formattedTotal}.`,
  ];
  return pick(templates);
}

function AppHeader() {
  return (
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 pb-1 pt-4">
      <div className="min-w-0" />

      <div className="text-center">
        <p className="font-brand text-[1.9rem] tracking-[0.22em] text-white">ZELVA</p>
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
      <div className="flex items-center justify-between rounded-full bg-[#111113] px-4 py-2 text-[12px] text-[#D1D1D6]">
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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-[22px] px-4 py-3 text-[15px] leading-[1.45] shadow-[0_10px_24px_rgba(0,0,0,0.18)] ${
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
    }, 420);
  };

  return (
    <main className="flex min-h-screen justify-center bg-black text-white">
      <div className="flex min-h-screen w-full max-w-md flex-col bg-black">
        <AppHeader dailyTotal={dailyTotal} />
        <HeaderStats streak={streak} xp={xp} dailyTotal={dailyTotal} />

        <div ref={chatViewportRef} className="flex-1 space-y-4 overflow-y-auto px-4 pb-6 pt-3">
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
