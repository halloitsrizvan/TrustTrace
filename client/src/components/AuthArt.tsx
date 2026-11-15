"use client";
import { motion, useReducedMotion } from "motion/react";

const qr = [
  [1, 1, 1, 0, 1], [1, 0, 1, 1, 0], [1, 1, 1, 0, 1], [0, 1, 0, 1, 1], [1, 0, 1, 1, 1],
];
const spring = { type: "spring" as const, stiffness: 90, damping: 11 };

/**
 * Wordless motion piece for the sign-in screens.
 * Sequence: two tags drop in and swing on their strings, the string draws between them,
 * the match badge pops, the handover code slides in and gets scanned. Then it idles on gentle loops.
 * With reduced motion it renders the final frame and nothing moves.
 */
export function AuthArt() {
  const still = !!useReducedMotion();
  const loop = (dur: number, delay = 0) => ({ duration: dur, delay, repeat: Infinity, ease: "easeInOut" as const });
  const drift = (dy: number, dur: number, delay = 0) => ({
    animate: still ? { y: 0 } : { y: [0, dy, 0] },
    transition: loop(dur, delay),
  });

  return (
    <svg viewBox="0 0 900 760" aria-hidden className="max-h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="art-shadow" filterUnits="userSpaceOnUse" x="-400" y="-400" width="1800" height="1800">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#10306b" floodOpacity="0.22" />
        </filter>
        <clipPath id="qr-clip">
          <rect width="170" height="170" rx="28" />
        </clipPath>
      </defs>

      {/* drifting background bubbles */}
      <motion.circle cx="140" cy="130" r="120" fill="#fff" opacity="0.14" {...drift(22, 9)} />
      <motion.circle cx="780" cy="620" r="170" fill="#fff" opacity="0.12" {...drift(-26, 11, 1)} />
      <motion.circle cx="800" cy="120" r="60" fill="#fff" opacity="0.18" {...drift(18, 7, 0.5)} />
      <motion.circle cx="90" cy="640" r="46" fill="#fff" opacity="0.2" {...drift(-16, 8, 2)} />

      {/* string between the two tags draws itself */}
      <motion.path
        d="M262 190 C 330 20, 560 20, 640 170"
        fill="none"
        stroke="#10306b"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
        initial={still ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, delay: 0.9, ease: "easeInOut" }}
      />

      {/* lost tag: drops in, then sways from its hole */}
      <g transform="rotate(-7 280 400)">
        <motion.g
          initial={still ? false : { y: -520, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.1 }}
        >
          <motion.g
            style={{ transformOrigin: "190px 236px" }}
            animate={still ? { rotate: 0 } : { rotate: [0, 2.6, -2.6, 0] }}
            transition={loop(6, 1.4)}
          >
            <g filter="url(#art-shadow)">
              <path d="M130 200h200a24 24 0 0 1 24 24v330a24 24 0 0 1-24 24H130a24 24 0 0 1-24-24V224a24 24 0 0 1 24-24z" fill="#fff" />
              <path d="M106 224a24 24 0 0 1 24-24h14v398h-14a24 24 0 0 1-24-24z" fill="#f26b21" />
              <circle cx="190" cy="236" r="16" fill="#cfe2ff" />
              <rect x="172" y="282" width="164" height="150" rx="20" fill="#e4eeff" />
              <rect x="222" y="318" width="64" height="86" rx="12" fill="none" stroke="#51628a" strokeWidth="6" />
              <circle cx="254" cy="390" r="5" fill="#51628a" />
              <rect x="172" y="456" width="130" height="14" rx="7" fill="#10203f" />
              <rect x="172" y="484" width="90" height="10" rx="5" fill="#9fb3da" />
              <line x1="150" y1="524" x2="330" y2="524" stroke="#d3e0f5" strokeWidth="3" strokeDasharray="8 8" />
              <rect x="172" y="544" width="70" height="12" rx="6" fill="#9fb3da" />
              <rect x="262" y="540" width="60" height="22" rx="11" fill="#ffe9db" />
            </g>
          </motion.g>
        </motion.g>
      </g>

      {/* found tag: drops in a beat later, sways the other way */}
      <g transform="rotate(6 640 480)">
        <motion.g
          initial={still ? false : { y: -560, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 0.35 }}
        >
          <motion.g
            style={{ transformOrigin: "650px 286px" }}
            animate={still ? { rotate: 0 } : { rotate: [0, -2.6, 2.6, 0] }}
            transition={loop(6.5, 1.8)}
          >
            <g filter="url(#art-shadow)">
              <path d="M520 250h200a24 24 0 0 1 24 24v330a24 24 0 0 1-24 24H520a24 24 0 0 1-24-24V274a24 24 0 0 1 24-24z" fill="#fff" />
              <path d="M720 250h-14v378h14a24 24 0 0 0 24-24V274a24 24 0 0 0-24-24z" fill="#0fa77a" />
              <circle cx="650" cy="286" r="16" fill="#cfe2ff" />
              <rect x="518" y="332" width="164" height="150" rx="20" fill="#e4eeff" />
              <rect x="560" y="360" width="80" height="94" rx="14" fill="none" stroke="#51628a" strokeWidth="6" />
              <circle cx="600" cy="400" r="14" fill="none" stroke="#51628a" strokeWidth="6" />
              <rect x="518" y="506" width="120" height="14" rx="7" fill="#10203f" />
              <rect x="518" y="534" width="84" height="10" rx="5" fill="#9fb3da" />
              <line x1="518" y1="574" x2="690" y2="574" stroke="#d3e0f5" strokeWidth="3" strokeDasharray="8 8" />
              <rect x="518" y="594" width="70" height="12" rx="6" fill="#9fb3da" />
              <rect x="608" y="590" width="60" height="22" rx="11" fill="#d9f5ec" />
            </g>
          </motion.g>
        </motion.g>
      </g>

      {/* match badge pops once the string lands, then pulses */}
      <g transform="translate(450 150)">
        {!still ? (
          <motion.circle
            r="44"
            fill="none"
            stroke="#2273eb"
            strokeWidth="4"
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: [1, 2], opacity: [0.55, 0] }}
            transition={{ duration: 2.4, delay: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
        ) : null}
        <motion.g
          filter="url(#art-shadow)"
          initial={still ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 12, delay: 1.7 }}
        >
          <circle r="44" fill="#2273eb" />
          <motion.path
            d="M-18 2 -5 16 20 -14"
            fill="none"
            stroke="#fff"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={still ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 1.95, ease: "easeOut" }}
          />
        </motion.g>
      </g>

      {/* handover code slides in and is scanned */}
      <g transform="translate(600 560) rotate(5)">
        <motion.g
          initial={still ? false : { x: 140, y: 120, opacity: 0 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          transition={{ ...spring, delay: 2.3 }}
        >
          <motion.g animate={still ? { y: 0 } : { y: [0, -8, 0] }} transition={loop(5, 3.4)}>
            <g filter="url(#art-shadow)">
              <rect width="170" height="170" rx="28" fill="#fff" />
            </g>
            {qr.flatMap((row, y) =>
              row.map((on, x) =>
                on ? <rect key={`${x}-${y}`} x={26 + x * 24} y={26 + y * 24} width="18" height="18" rx="4" fill="#10203f" /> : null,
              ),
            )}
            {!still ? (
              <g clipPath="url(#qr-clip)">
                <motion.rect
                  x="12"
                  width="146"
                  height="8"
                  rx="4"
                  fill="#2273eb"
                  opacity="0.75"
                  initial={{ y: 16 }}
                  animate={{ y: [16, 146, 16] }}
                  transition={{ duration: 2.8, delay: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </g>
            ) : null}
          </motion.g>
        </motion.g>
      </g>
    </svg>
  );
}
