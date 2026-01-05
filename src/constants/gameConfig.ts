export const LEFT_COLUMN_VALUES = [0.05, 1, 5, 10, 20, 50, 100, 125, 150, 200, 250]
export const RIGHT_COLUMN_VALUES = [300, 350, 400, 450, 500, 600, 700, 800, 1000, 2000, 4000]
export const ALL_VALUES = [...LEFT_COLUMN_VALUES, ...RIGHT_COLUMN_VALUES]

export const CASES_TO_OPEN_PER_ROUND = [6, 5, 4, 3, 2, 1]

export const BANKER_THINKING_DELAYS = {
  round0: { min: 10000, max: 20000 },
  round1: { min: 7500, max: 15000 },
  round2: { min: 5000, max: 15000 },
  default: { min: 2500, max: 12500 }
}

export const PHONE_RING_INTERVAL = 5000

export const THINKING_SOUNDS = ['thinking01.mp3', 'thinking02.mp3', 'thinking03.mp3']

export const BANKER_REMARKS = {
  terrible: [
    "Is that a joke? This has to be a mistake!",
    "The banker must be laughing all the way to the bank with that offer!",
    "That's not an offer, that's an insult wrapped in pesos!",
    "Is the banker even awake??",
    "The banker thinks you were born yesterday!"
  ],
  poor: [
    "Hmm, the banker is being a bit stingy today...",
    "That's barely enough for a meal, let alone life-changing money!",
    "The banker is clearly hoping you'll panic!",
    "Who is the banker anyway??!",
    "That offer is weaker than my morning coffee!"
  ],
  fair: [
    "Now we're talking! A respectable offer on the table.",
    "The banker is playing it safe with this one.",
    "Not bad, not bad at all... but is it enough?",
    "A solid offer, but there could be more in your case!",
    "The banker is being reasonable... suspiciously reasonable!"
  ],
  good: [
    "WOW! The banker is getting nervous!",
    "That's a serious offer! Someone's sweating in that bank!",
    "The banker must really want you to take this deal!",
    "Now THAT'S what I call an offer! The banker sees something!",
    "Holy pesos! The banker is practically begging you to stop!"
  ],
  excellent: [
    "JACKPOT ALERT! The banker is in full panic mode!",
    "That's an INSANE offer! The banker knows you've got the goods!",
    "The banker is about to go broke!",
    "I can hear the banker crying from here with that offer!",
    "That's 'retire early' money right there! The banker is DESPERATE!"
  ]
} as const

export type RemarkCategory = keyof typeof BANKER_REMARKS
