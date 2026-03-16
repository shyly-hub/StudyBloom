
import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

const QUOTES = [
  { text: "Small steps every day build the life you want.",       author: "StudyBloom"     },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "A. Lincoln" },
  { text: "The secret of getting ahead is getting started.",      author: "M. Twain"       },
  { text: "Focus is the art of knowing what to ignore.",          author: "StudyBloom"     },
  { text: "Your future self is watching. Make them proud.",        author: "StudyBloom"     },
  { text: "One focused hour beats five distracted ones.",          author: "StudyBloom"     },
  { text: "You don't rise to your goals. You fall to your systems.", author: "J. Clear"    },
  { text: "The pain of discipline is lighter than the pain of regret.", author: "StudyBloom" },
  { text: "Every session you complete is a vote for who you're becoming.", author: "StudyBloom" },
  { text: "Don't wish for it. Work for it.",                       author: "StudyBloom"     },
  { text: "Progress, not perfection.",                             author: "StudyBloom"     },
  { text: "Your brain is a muscle. Train it daily.",               author: "StudyBloom"     },
  { text: "Consistency is more powerful than intensity.",           author: "StudyBloom"     },
  { text: "Study hard in silence. Let success make the noise.",    author: "StudyBloom"     },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "You are one study session away from a better mood.",    author: "StudyBloom"     },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "T. Notke"       },
  { text: "Do something today your future self will thank you for.", author: "StudyBloom"   },
  { text: "Learning never exhausts the mind.",                     author: "da Vinci"       },
  { text: "Show up for yourself — even on the hard days.",        author: "StudyBloom"     },
  { text: "The expert was once a beginner who never quit.",        author: "StudyBloom"     },
  { text: "Great things take time. You're doing great.",          author: "StudyBloom"     },
  { text: "Knowledge is power. Consistency is the key.",          author: "StudyBloom"     },
  { text: "Even 10 minutes counts. Start.",                        author: "StudyBloom"     },
  { text: "Your only competition is who you were yesterday.",     author: "StudyBloom"     },
  { text: "Rest if you must, but don't you quit.",                author: "E. Guest"       },
  { text: "Believe you can and you're halfway there.",            author: "T. Roosevelt"   },
  { text: "Energy flows where attention goes.",                    author: "StudyBloom"     },
  { text: "Every master was once a disaster.",                    author: "StudyBloom"     },
  { text: "Stars can't shine without darkness.",                  author: "StudyBloom"     },
  { text: "Today's preparation is tomorrow's performance.",       author: "StudyBloom"     },
];

export default function DailyQuote({ C, style = {} }) {
  // Pick quote based on day of year — same quote all day, changes at midnight
  const quote = useMemo(() => {
    const now   = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const day   = Math.floor((now - start) / 86400000);
    return QUOTES[day % QUOTES.length];
  }, []);

  return (
    <View style={[{
      backgroundColor: C.card,
      borderRadius:    18,
      padding:         16,
      borderWidth:     1,
      borderColor:     C.border,
      borderLeftWidth: 4,
      borderLeftColor: C.blue,
    }, style]}>
      <Text style={{ fontSize: 9, fontWeight: '800', color: C.blue, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
        ✦ Today's Motivation
      </Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: C.text, lineHeight: 20, fontStyle: 'italic', marginBottom: 6 }}>
        "{quote.text}"
      </Text>
      <Text style={{ fontSize: 11, color: C.muted, fontWeight: '500', textAlign: 'right' }}>
        — {quote.author}
      </Text>
    </View>
  );
}