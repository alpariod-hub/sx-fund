import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck, Key, Wallet, AlertTriangle, CheckCircle2,
  Circle, ArrowRight, RefreshCw, ScanLine, Users, Lock,
  FileWarning, Zap, ExternalLink, Bot,
} from "lucide-react";
import { INFRASTRUCTURE } from "@/lib/constants";

const PHASE_NEXT  = "bg-amber-400/15  text-amber-400  border-amber-400/30";
const PHASE_LATER = "bg-muted/30       text-muted-foreground border-border";

export default function Security() {
  return (
    <div className="p-8 space-y-8 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          Security Policy
        </h1>
        <p className="text-muted-foreground mt-1">
          Операционные правила безопасности, AML-процесс приёма платежей и управление кошельками.
        </p>
      </div>

      {/* Key Management Rules */}
      <Card className="border-rose-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-400">
            <Key className="h-5 w-5" />
            Правила хранения ключей — ОБЯЗАТЕЛЬНО
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: FileWarning, color: "text-rose-400",    rule: "Seed-фраза НИКОГДА не хранится в цифровом виде",            detail: "Нельзя: телефон, облако, email, фото, ноутбук. Только бумага — желательно стальная гравировка (Cryptosteel/Bilodal)." },
            { icon: Lock,        color: "text-amber-400",   rule: "Два физических экземпляра seed-фразы в разных местах",       detail: "Например: сейф в офисе + банковская ячейка. Если одно место недоступно — второй экземпляр всегда есть." },
            { icon: RefreshCw,   color: "text-blue-400",    rule: "Политика ротации кошельков",                                 detail: "Рабочие горячие кошельки обновляются раз в 6 месяцев или после любого подозрительного события. Safe (multisig) — основной постоянный кошелёк для хранения." },
            { icon: Wallet,      color: "text-violet-400",  rule: "Аппаратный кошелёк для ключевых операций",                  detail: "Андрей (Ledger) + Григорий (MetaMask/Rabby) — каждый со своей seed на бумаге. Safe требует 2-of-3 для любой отправки." },
          ].map((item) => (
            <div key={item.rule} className="flex gap-3 p-3 rounded-lg border border-border bg-muted/10">
              <item.icon className={`h-5 w-5 shrink-0 mt-0.5 ${item.color}`} />
              <div>
                <div className="font-semibold text-sm">{item.rule}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.detail}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AML Payment Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            AML-процесс приёма USDT от инвесторов
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Flow diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
            {[
              { step: "1", label: "Клиент нажимает «Оплатить»",                color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/30" },
              { step: "→", label: "" },
              { step: "2", label: "Уникальный временный кошелёк генерируется", color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/30" },
              { step: "→", label: "" },
              { step: "3", label: "USDT поступает, замораживается",             color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/30" },
            ].map((item, i) =>
              item.step === "→" ? (
                <div key={i} className="flex justify-center"><ArrowRight className="h-5 w-5 text-muted-foreground" /></div>
              ) : (
                <div key={i} className={`rounded-lg border p-3 text-center ${item.bg}`}>
                  <div className={`text-xs font-bold mb-1 font-mono ${item.color}`}>Шаг {item.step}</div>
                  <div className="text-xs text-foreground leading-tight">{item.label}</div>
                </div>
              )
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold text-sm text-emerald-400">Риск низкий — AML пройден</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Автоматический перевод на Safe multisig для закупок агропродукции.
                Средства смешиваются с основным пулом.
              </p>
              <div className="text-[10px] font-mono text-muted-foreground">
                Временный → Safe {INFRASTRUCTURE.safeAddress.slice(0, 10)}…
              </div>
            </div>
            <div className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span className="font-semibold text-sm text-rose-400">Риск высокий — средства заморожены</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Деньги остаются на изолированном временном кошельке. Ручное решение:
                возврат отправителю или запрос KYC-документов.
              </p>
              <div className="text-[10px] font-mono text-muted-foreground">Не смешивается с чистыми средствами ✓</div>
            </div>
          </div>

          {/* AML Providers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-muted/10 p-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <ScanLine className="h-3.5 w-3.5" /> AMLBot — основной AML-провайдер
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div><div className="text-muted-foreground mb-1">Стоимость</div><div className="font-mono">&lt;$1 / чек</div><div className="text-[10px] text-muted-foreground">Старт $10–20</div></div>
                <div><div className="text-muted-foreground mb-1">Этап 1</div><div className="font-mono">Telegram-бот</div><div className="text-[10px] text-muted-foreground">Без кода</div></div>
                <div><div className="text-muted-foreground mb-1">Этап 2</div><div className="font-mono">REST API</div><div className="text-[10px] text-muted-foreground">$100–300/мес</div></div>
              </div>
              <a href="https://amlbot.com" target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                amlbot.com <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* ChainGPT */}
            <div className="rounded-lg border border-violet-400/30 bg-violet-400/5 p-4">
              <div className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Bot className="h-3.5 w-3.5" /> ChainGPT AI — аудит контрактов
              </div>
              <div className="space-y-2 text-xs mb-3">
                {[
                  { label: "Аудит смарт-контрактов",   badge: "✅ Да",        note: "3 бесплатных аудита" },
                  { label: "Compliance-проверки",       badge: "✅ Да",        note: "5 бесплатных запросов" },
                  { label: "Генерация контрактов",      badge: "⚠️ Частично", note: "У нас thirdweb" },
                  { label: "Замена AMLBot",             badge: "❌ Нет",       note: "Разные задачи" },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{r.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{r.note}</span>
                      <span className="font-mono text-[10px]">{r.badge}</span>
                    </div>
                  </div>
                ))}
              </div>
              <a href="https://t.me/ChainGPTAI_Bot" target="_blank" rel="noreferrer"
                 className="inline-flex items-center gap-1 text-xs text-violet-400 hover:underline">
                @ChainGPTAI_Bot <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multisig Setup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gnosis Safe — Мультиподпись 2-of-3
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { role: "Андрей (LLP)",   label: "Подписант 1", wallet: "Ledger (аппаратный)",  color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/30" },
              { role: "Григорий (LLP)", label: "Подписант 2", wallet: "MetaMask / Rabby",      color: "text-blue-400",   bg: "bg-blue-400/10 border-blue-400/30" },
              { role: "TBD",                 label: "Подписант 3", wallet: "Аппаратный кошелёк",   color: "text-muted-foreground", bg: "bg-muted/20 border-border" },
            ].map(s => (
              <div key={s.role} className={`rounded-lg border p-4 ${s.bg}`}>
                <div className={`font-bold ${s.color}`}>{s.role}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-xs mt-2 font-mono">{s.wallet}</div>
                <div className="mt-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">TBD</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs space-y-2">
            <div className="font-semibold text-sm">Правило: 2 подписи из 3 для любой отправки</div>
            <p className="text-muted-foreground">
              Ни один подписант не может отправить средства в одиночку.
              Даже если один аккаунт взломан — средства в безопасности.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-muted-foreground">Safe адрес:</span>
              <span className="font-mono text-primary">{INFRASTRUCTURE.safeAddress}</span>
            </div>
            <a href="https://app.safe.global" target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-1 text-primary hover:underline mt-1">
              Создать Safe на app.safe.global <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Дорожная карта внедрения
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              phase: "Фаза 1 — Ручное тестирование",
              status: "next",
              statusLabel: "Следующий шаг",
              items: [
                "Зарегистрироваться на AMLBot ($10–20 стартовый пакет)",
                "Проверить первые транзакции вручную через Telegram-бота AMLBot",
                "Использовать @ChainGPTAI_Bot для аудита контрактов (3 бесплатных)",
                "Создать Safe 2-of-3 на app.safe.global (Polygon network)",
                "Seed-фразы всех подписантов — только на бумаге / стальной гравировке",
              ],
            },
            {
              phase: "Фаза 2 — Автоматизация",
              status: "later",
              statusLabel: "Планируется",
              items: [
                "Подключить AMLBot API к системе приёма платежей",
                "Автогенерация уникальных временных кошельков per клиент",
                "Автоматический sweep чистых средств → Safe multisig",
                "KYC верификация пользователей через AMLBot",
                "Кастомный Telegram-бот для трекинга сделок и уведомлений",
              ],
            },
            {
              phase: "Фаза 3 — Цифровые продукты",
              status: "later",
              statusLabel: "Перспектива",
              items: [
                "Веб-приложение для инвесторов (SED-Hub публичный фронт)",
                "Мобильное приложение (iOS/Android) — трекинг портфеля",
                "Centrifuge Pool — привлечение внешних инвесторов",
                "Chainlink Proof of Reserve для on-chain верификации активов",
                "Ротация горячих кошельков по расписанию (каждые 6 мес.)",
              ],
            },
          ].map((section) => (
            <div key={section.phase} className={`rounded-lg border p-4 ${section.status === "next" ? PHASE_NEXT : PHASE_LATER}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-sm">{section.phase}</div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                  section.status === "next"
                    ? "bg-amber-400/20 text-amber-400 border-amber-400/40"
                    : "bg-muted text-muted-foreground border-border"
                }`}>{section.statusLabel}</span>
              </div>
              <div className="space-y-1.5">
                {section.items.map(item => (
                  <div key={item} className="flex items-start gap-2 text-xs">
                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Wallet Rotation Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Политика ротации кошельков
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {[
              { trigger: "Плановая ротация",             period: "Каждые 6 месяцев",           action: "Генерация нового горячего кошелька, перевод остатка, деактивация старого адреса" },
              { trigger: "Подозрительная активность",     period: "Немедленно",                 action: "Заморозить исходящие, перевести средства через multisig, сменить кошелёк" },
              { trigger: "Компрометация устройства",      period: "Немедленно",                 action: "Safe не затронут (multisig). Сменить ключ подписанта через 2 оставшихся подписанта" },
              { trigger: "Смена участника команды",       period: "При уходе участника",        action: "Пересоздать Safe с новым порогом. Старый ключ выбывает через 2-of-2 транзакцию смены" },
            ].map(r => (
              <div key={r.trigger} className="p-3 rounded-lg border border-border bg-muted/10 space-y-1">
                <div className="font-semibold text-foreground">{r.trigger}</div>
                <div className="text-primary font-mono">{r.period}</div>
                <div className="text-muted-foreground">{r.action}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
