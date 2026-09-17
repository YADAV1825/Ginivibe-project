'use client';

import React from 'react';
import { Rocket, Mic, Orbit, MessagesSquare } from 'lucide-react';
import { Reveal } from './reveal';

const TESTIMONIALS = [
  {
    quote: 'I typed one sentence about who I wanted to meet. By Sunday I had a trekking group.',
    name: 'Ananya Sharma',
    role: 'Founder, Delhi',
  },
  {
    quote: 'The listening rooms feel like a friend’s terrace, not an app.',
    name: 'Arjun Malhotra',
    role: 'Musician, Mumbai',
  },
  {
    quote: 'My chart finally made sense. No predictions, just patterns I recognize.',
    name: 'Priya Nair',
    role: 'Doctor, Hyderabad',
  },
  {
    quote: 'Hosted my first offline meetup from my phone. Forty people showed up.',
    name: 'Rohan Mehta',
    role: 'Designer, Bangalore',
  },
  {
    quote: 'An AI character roasted my pitch deck for an hour. Demo day went great.',
    name: 'Vikram Singh',
    role: 'Engineer, Delhi',
  },
  {
    quote: 'Speed Matching Friday is now my favorite night of the week.',
    name: 'Kavya Reddy',
    role: 'Writer, Pune',
  },
];

/** Infinite member-stories marquee. The one marquee on the page.
 *  Pauses on hover/focus; collapses to a scroll row under reduced motion. */
export function Testimonials() {
  return (
    <section className="gv-section" id="stories" aria-labelledby="stories-heading">
      <div className="gv-wrap">
        <Reveal>
          <div className="gv-section-head">
            <h2 className="gv-section-title" id="stories-heading">
              People found their people.
            </h2>
            <p className="gv-section-lede">
              Unscripted nights, real friendships, and charts that finally
              made sense. Here is what members say.
            </p>
          </div>
        </Reveal>
      </div>
      <Reveal delay={100}>
        <div className="gv-marquee" role="list" aria-label="Member stories">
          <div className="gv-marquee-track">
            {[0, 1].map((copy) => (
              <div
                key={copy}
                className="gv-marquee-group"
                aria-hidden={copy === 1 ? true : undefined}
              >
                {TESTIMONIALS.map((t) => (
                  <figure key={t.name} className="gv-quote" role="listitem">
                    <blockquote>“{t.quote}”</blockquote>
                    <figcaption>
                      <span className="gv-quote-avatar" aria-hidden="true">
                        {t.name.charAt(0)}
                      </span>
                      <span>
                        <b>{t.name}</b>
                        <span>{t.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const STACK = [
  {
    icon: Rocket,
    theme: 'lime' as const,
    title: 'For founders and builders',
    text: 'Founder breakfasts, build rooms, and late-night sparring with people who get the grind.',
    tags: ['AI matching', 'Rooms'],
  },
  {
    icon: Mic,
    theme: 'graphite' as const,
    title: 'For creators and hosts',
    text: 'Run listening rooms, workshops, and watch parties from your phone. Bring the vibe, we bring the crowd.',
    tags: ['Rooms', 'Events'],
  },
  {
    icon: Orbit,
    theme: 'white' as const,
    title: 'For the curious',
    text: 'Charts, characters, and conversations that go past small talk. Understand yourself, then find your orbit.',
    tags: ['Astrology', 'Gini AI'],
  },
  {
    icon: MessagesSquare,
    theme: 'champagne' as const,
    title: 'For newcomers',
    text: 'Say who you want to meet in one sentence. The app handles introductions, rooms, and first hellos.',
    tags: ['AI matching', 'Feed'],
  },
];

/** Sticky-stacking showcase: each card pins and the next slides over it.
 *  Pure CSS sticky, no scroll listeners. Color-blocked, no photography. */
export function ShowcaseStack() {
  return (
    <section className="gv-section" id="showcase" aria-labelledby="showcase-heading">
      <div className="gv-wrap">
        <Reveal>
          <div className="gv-section-head">
            <h2 className="gv-section-title" id="showcase-heading">
              One app, every kind of hangout.
            </h2>
            <p className="gv-section-lede">
              Whatever your scene is, there is a corner of GiniVibe already
              set up for it. Scroll through a few.
            </p>
          </div>
        </Reveal>
        <div className="gv-stack">
          {STACK.map((card, i) => (
            <article
              key={card.title}
              className={`gv-stack-card is-${card.theme}`}
              style={{ '--i': i } as React.CSSProperties}
            >
              <div className="gv-stack-icon" aria-hidden="true">
                <card.icon size={30} />
              </div>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              <div className="gv-stack-tags">
                {card.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
