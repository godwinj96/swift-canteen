import Image from "next/image";
import Link from "next/link";

const POPULAR_ITEMS = [
  {
    name: "Jollof Rice & Chicken",
    description: "Classic jollof with grilled chicken",
    price: "₦2,500",
    image: "https://loremflickr.com/500/400/rice",
  },
  {
    name: "Meat Pie",
    description: "Flaky pastry with spiced minced meat",
    price: "₦800",
    image: "https://loremflickr.com/500/400/meatpie,pastry",
  },
  {
    name: "Chapman",
    description: "Refreshing house cocktail",
    price: "₦1,200",
    image: "https://loremflickr.com/500/400/cocktail",
  },
  {
    name: "Chin Chin",
    description: "Crunchy sweet fried snack",
    price: "₦600",
    image: "https://loremflickr.com/500/400/fritters",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Browse & order",
    description: "Pick your items from today's menu and check out in under a minute.",
  },
  {
    number: "02",
    title: "Pay online",
    description: "Secure checkout — no cash, no card fumbling at the counter.",
  },
  {
    number: "03",
    title: "Pick up & go",
    description: "Walk in when it's ready, grab your tray, skip the queue entirely.",
  },
];

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto flex max-w-6xl flex-col items-end justify-between gap-10 px-4 sm:px-8 pt-6 lg:flex-row">
        <div className="flex max-w-xl flex-col gap-6">
          <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
            Campus canteen, online
          </span>
          <h1 className="font-display text-6xl leading-[0.98] tracking-tight text-ink sm:text-7xl">
            Order ahead.
            <br />
            Skip the line.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-muted">
            Browse today&apos;s menu, pay online, and pick up the moment it&apos;s ready — no more
            standing between classes.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/menu"
              className="rounded-full bg-canteen px-8 py-4 text-sm font-semibold text-white hover:bg-canteen-dark"
            >
              Browse the menu
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-line px-7 py-4 text-sm font-semibold text-ink hover:bg-canteen-light"
            >
              Create an account
            </Link>
          </div>
        </div>

        <div className="relative mb-10 w-full max-w-[600px] shrink-0 sm:mb-6 lg:mb-0">
          <Image
            src="https://loremflickr.com/620/680/curry"
            alt="A steaming plate of rice and stew"
            width={600}
            height={620}
            className="h-[380px] w-full rounded-3xl object-cover sm:h-[480px] lg:h-[620px]"
            priority
          />
          <div className="absolute -bottom-4 left-2 w-[calc(100%-4.5rem)] max-w-[300px] rounded-2xl bg-canteen-light p-4 shadow-xl sm:-bottom-6 sm:-left-10 sm:w-[300px] sm:p-7">
            <p className="text-[11px] font-semibold tracking-[0.06em] text-canteen-dark uppercase sm:text-[13px]">
              On the tray today
            </p>
            <ul className="mt-3 flex flex-col gap-2 sm:mt-5 sm:gap-3.5">
              {[
                ["Jollof Rice & Chicken", "₦2,500"],
                ["Meat Pie", "₦800"],
                ["Chapman", "₦1,200"],
              ].map(([name, price]) => (
                <li key={name} className="flex items-baseline justify-between gap-3 text-sm sm:text-[16px]">
                  <span className="font-medium text-ink">{name}</span>
                  <span className="shrink-0 text-muted">{price}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute -bottom-4 right-2 flex w-[140px] flex-col gap-1.5 rounded-2xl bg-ink p-3.5 shadow-xl sm:-right-8 sm:-bottom-6 sm:w-[188px] sm:gap-2.5 sm:p-5">
            <div className="flex flex-row gap-0.5">
              {[0, 1, 2, 3].map((i) => (
                <StarIcon key={i} fill="var(--color-canteen)" />
              ))}
              <StarIcon fill="url(#half-star-fill)" />
            </div>
            <p className="text-sm font-semibold text-white sm:text-base">4.9 stars</p>
            <p className="text-[11px] font-medium text-stone-400 sm:text-[13px]">from 1,200+ orders</p>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-24 h-px max-w-6xl bg-line" />

      <section className="mx-auto max-w-6xl px-4 sm:px-8 py-16">
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
              Popular right now
            </span>
            <h2 className="font-display text-4xl tracking-tight text-ink">What everyone&apos;s grabbing</h2>
          </div>
          <Link href="/menu" className="text-[15px] font-semibold text-ink hover:text-canteen">
            See full menu →
          </Link>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_ITEMS.map((item) => (
            <div key={item.name} className="flex flex-col gap-3.5">
              <Image
                src={item.image}
                alt={item.name}
                width={400}
                height={200}
                className="h-[200px] w-full rounded-xl object-cover"
              />
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold text-ink">{item.name}</h3>
                <span className="shrink-0 font-semibold text-canteen-dark">{item.price}</span>
              </div>
              <p className="text-sm text-muted">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-row flex-wrap gap-16 bg-ink px-4 sm:px-8 py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col gap-3">
              <span className="font-display text-4xl leading-none text-canteen">{step.number}</span>
              <h3 className="text-lg font-semibold text-white">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-stone-400">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="half-star-fill">
            <stop offset="50%" stopColor="var(--color-canteen)" />
            <stop offset="50%" stopColor="#57534E" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function StarIcon({ fill }: { fill: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        d="M12 2 L14.9 8.6 L22 9.3 L16.5 14 L18.2 21 L12 17.3 L5.8 21 L7.5 14 L2 9.3 L9.1 8.6 Z"
        fill={fill}
      />
    </svg>
  );
}
