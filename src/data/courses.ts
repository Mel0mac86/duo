import type { Course, LessonDef, Sentence, Word } from '../types'
import {
  chinese, dutch, french, german, greek, japanese, korean, polish, portuguese, romanian, russian, swedish, turkish,
} from './languages'

// All course content below is original to Parlami.

const w = (native: string, target: string, emoji: string): Word => ({ native, target, emoji })
const s = (native: string, target: string, targetAlts: string[] = [], nativeAlts: string[] = []): Sentence =>
  ({ native, target, targetAlts, nativeAlts })
const lesson = (id: string, title: string, words: Word[], sentences: Sentence[]): LessonDef =>
  ({ id, title, words, sentences })

export const english: Course = {
  id: 'en-it',
  targetLang: 'en-GB',
  nativeLang: 'it-IT',
  title: 'Inglese',
  targetName: 'inglese',
  flag: '🇬🇧',
  units: [
    {
      id: 'en-u1',
      title: 'Primi passi',
      description: 'Saluta, presentati, parla di persone, cibo e animali',
      lessons: [
        lesson('en-u1-l1', 'Saluti', [
          w('ciao', 'hello', '👋'), w('grazie', 'thank you', '🙏'), w('arrivederci', 'goodbye', '🚪'),
          w('buongiorno', 'good morning', '☀️'), w('buonanotte', 'good night', '🌙'),
        ], [
          s('Ciao, mi chiamo Luca.', 'Hello, my name is Luca.', ['Hi, my name is Luca.', 'Hello, I am Luca.', 'Hi, I am Luca.']),
          s('Buongiorno, Marta!', 'Good morning, Marta!'),
          s('Grazie, arrivederci!', 'Thank you, goodbye!', ['Thanks, goodbye!', 'Thank you, bye!', 'Thanks, bye!']),
          s('Buonanotte, mamma.', 'Good night, mom.', ['Good night, mum.', 'Good night, mother.', 'Goodnight, mom.', 'Goodnight, mum.']),
        ]),
        lesson('en-u1-l2', 'Persone', [
          w('uomo', 'man', '👨'), w('donna', 'woman', '👩'), w('ragazzo', 'boy', '👦'),
          w('ragazza', 'girl', '👧'), w('bambino', 'child', '🧒'),
        ], [
          s('Io sono una donna.', 'I am a woman.', [], ['Sono una donna.']),
          s('Lui è un ragazzo.', 'He is a boy.', [], ['È un ragazzo.']),
          s('Lei è una ragazza.', 'She is a girl.', [], ['È una ragazza.']),
          s('Tu sei un uomo.', 'You are a man.', [], ['Sei un uomo.']),
        ]),
        lesson('en-u1-l3', 'Cibo', [
          w('mela', 'apple', '🍎'), w('pane', 'bread', '🍞'), w('acqua', 'water', '💧'),
          w('latte', 'milk', '🥛'), w('formaggio', 'cheese', '🧀'),
        ], [
          s('Io mangio una mela.', 'I eat an apple.', ['I am eating an apple.'], ['Mangio una mela.']),
          s('Lei beve acqua.', 'She drinks water.', ['She is drinking water.', 'She drinks some water.'], ["Lei beve dell'acqua."]),
          s('Il ragazzo mangia pane.', 'The boy eats bread.', ['The boy is eating bread.', 'The boy eats some bread.'], ['Il ragazzo mangia il pane.']),
          s('Noi beviamo latte.', 'We drink milk.', ['We are drinking milk.'], ['Beviamo latte.', 'Beviamo il latte.']),
        ]),
        lesson('en-u1-l4', 'Animali', [
          w('cane', 'dog', '🐶'), w('gatto', 'cat', '🐱'), w('uccello', 'bird', '🐦'),
          w('cavallo', 'horse', '🐴'), w('pesce', 'fish', '🐟'),
        ], [
          s('Il gatto beve latte.', 'The cat drinks milk.', ['The cat is drinking milk.'], ['Il gatto beve il latte.']),
          s('Ho un cane.', 'I have a dog.', ['I have got a dog.'], ['Io ho un cane.']),
          s('Il cavallo è grande.', 'The horse is big.', ['The horse is large.']),
          s("L'uccello è piccolo.", 'The bird is small.', ['The bird is little.']),
        ]),
      ],
    },
    {
      id: 'en-u2',
      title: 'Vita di tutti i giorni',
      description: 'Famiglia, casa, colori e momenti della giornata',
      lessons: [
        lesson('en-u2-l1', 'Famiglia', [
          w('madre', 'mother', '👩'), w('padre', 'father', '👨'), w('sorella', 'sister', '👭'),
          w('fratello', 'brother', '👬'), w('nonna', 'grandmother', '👵'),
        ], [
          s('Mio padre legge un libro.', 'My father reads a book.', ['My father is reading a book.', 'My dad reads a book.', 'My dad is reading a book.']),
          s('Ho una sorella.', 'I have a sister.', ['I have got a sister.'], ['Io ho una sorella.']),
          s('Mia nonna cucina la pasta.', 'My grandmother cooks pasta.', ['My grandmother is cooking pasta.', 'My grandma cooks pasta.', 'My grandmother cooks the pasta.']),
          s('Lui è mio fratello.', 'He is my brother.', [], ['È mio fratello.']),
        ]),
        lesson('en-u2-l2', 'Casa', [
          w('casa', 'house', '🏠'), w('letto', 'bed', '🛏️'), w('porta', 'door', '🚪'),
          w('finestra', 'window', '🪟'), w('tavolo', 'table', '🍽️'),
        ], [
          s('La casa è nuova.', 'The house is new.', ['The home is new.']),
          s('Il letto è comodo.', 'The bed is comfortable.', ['The bed is comfy.']),
          s('Apri la finestra, per favore.', 'Open the window, please.', ['Please open the window.']),
          s('Il gatto è sotto il tavolo.', 'The cat is under the table.', ['The cat is underneath the table.']),
        ]),
        lesson('en-u2-l3', 'Colori', [
          w('rosso', 'red', '🔴'), w('blu', 'blue', '🔵'), w('verde', 'green', '🟢'),
          w('giallo', 'yellow', '🟡'), w('nero', 'black', '⚫'),
        ], [
          s('La mela è rossa.', 'The apple is red.'),
          s('Il mio cane è nero.', 'My dog is black.', [], ['Mio cane è nero.']),
          s('Ho una porta blu.', 'I have a blue door.', ['I have got a blue door.']),
          s('Il sole è giallo.', 'The sun is yellow.'),
        ]),
        lesson('en-u2-l4', 'Giornata', [
          w('oggi', 'today', '📅'), w('domani', 'tomorrow', '⏭️'), w('ieri', 'yesterday', '⏮️'),
          w('mattina', 'morning', '🌅'), w('sera', 'evening', '🌆'),
        ], [
          s('Oggi è lunedì.', 'Today is Monday.', ['It is Monday today.']),
          s('Ci vediamo domani.', 'See you tomorrow.', ['We will see each other tomorrow.']),
          s('La mattina bevo il caffè.', 'In the morning I drink coffee.', ['I drink coffee in the morning.']),
          s('Stasera mangiamo la pizza.', 'Tonight we eat pizza.', ['This evening we eat pizza.', 'We eat pizza tonight.', 'We are eating pizza tonight.', 'Tonight we are eating pizza.']),
        ]),
      ],
    },
    {
      id: 'en-u3',
      title: 'In viaggio',
      description: 'Muoviti in città, prendi un treno, ordina al ristorante',
      lessons: [
        lesson('en-u3-l1', 'Città', [
          w('strada', 'street', '🛣️'), w('stazione', 'station', '🚉'), w('negozio', 'shop', '🏪'),
          w('ospedale', 'hospital', '🏥'), w('scuola', 'school', '🏫'),
        ], [
          s("Dov'è la stazione?", 'Where is the station?', [], ['Dove è la stazione?']),
          s('La scuola è vicina.', 'The school is near.', ['The school is close.', 'The school is nearby.', 'The school is close by.']),
          s('Il negozio è chiuso.', 'The shop is closed.', ['The store is closed.']),
          s("Vado all'ospedale.", 'I am going to the hospital.', ['I go to the hospital.']),
        ]),
        lesson('en-u3-l2', 'Trasporti', [
          w('treno', 'train', '🚆'), w('autobus', 'bus', '🚌'), w('aereo', 'plane', '✈️'),
          w('bicicletta', 'bike', '🚲'), w('macchina', 'car', '🚗'),
        ], [
          s('Prendo il treno.', 'I take the train.', ['I am taking the train.']),
          s("L'autobus è in ritardo.", 'The bus is late.'),
          s('Andiamo in macchina.', 'We go by car.', ['We are going by car.', 'Let us go by car.']),
          s("L'aereo parte domani.", 'The plane leaves tomorrow.', ['The plane departs tomorrow.', 'The plane is leaving tomorrow.']),
        ]),
        lesson('en-u3-l3', 'Ristorante', [
          w('menù', 'menu', '📋'), w('conto', 'bill', '🧾'), w('cameriere', 'waiter', '🤵'),
          w('vino', 'wine', '🍷'), w('zuppa', 'soup', '🍲'),
        ], [
          s('Il conto, per favore.', 'The bill, please.', ['The check, please.']),
          s('Vorrei una zuppa.', 'I would like a soup.', ['I would like some soup.']),
          s('Il cameriere porta il menù.', 'The waiter brings the menu.'),
          s('Un bicchiere di vino rosso.', 'A glass of red wine.'),
        ]),
        lesson('en-u3-l4', 'Hotel', [
          w('chiave', 'key', '🔑'), w('valigia', 'suitcase', '🧳'), w('notte', 'night', '🌃'),
          w('colazione', 'breakfast', '🥐'), w('camera', 'room', '🛎️'),
        ], [
          s('Ho una prenotazione.', 'I have a reservation.', ['I have a booking.', 'I have got a reservation.']),
          s('La chiave è sul tavolo.', 'The key is on the table.'),
          s('La colazione è alle otto.', 'Breakfast is at eight.', ['The breakfast is at eight.', 'Breakfast is at 8.']),
          s('La mia valigia è pesante.', 'My suitcase is heavy.'),
        ]),
      ],
    },
  ],
}

export const spanish: Course = {
  id: 'es-it',
  targetLang: 'es-ES',
  nativeLang: 'it-IT',
  title: 'Spagnolo',
  targetName: 'spagnolo',
  flag: '🇪🇸',
  units: [
    {
      id: 'es-u1',
      title: 'Primi passi',
      description: 'Saluta, presentati, parla di persone e cibo',
      lessons: [
        lesson('es-u1-l1', 'Saluti', [
          w('ciao', 'hola', '👋'), w('grazie', 'gracias', '🙏'), w('arrivederci', 'adiós', '🚪'),
          w('buongiorno', 'buenos días', '☀️'), w('buonanotte', 'buenas noches', '🌙'),
        ], [
          s('Ciao, mi chiamo Luca.', 'Hola, me llamo Luca.', ['Hola, soy Luca.']),
          s('Buongiorno, Marta!', '¡Buenos días, Marta!'),
          s('Grazie, arrivederci.', 'Gracias, adiós.'),
          s('Buonanotte, mamma.', 'Buenas noches, mamá.'),
        ]),
        lesson('es-u1-l2', 'Persone', [
          w('uomo', 'hombre', '👨'), w('donna', 'mujer', '👩'), w('bambino', 'niño', '👦'),
          w('bambina', 'niña', '👧'), w('ragazzo', 'chico', '🧑'),
        ], [
          s('Io sono una donna.', 'Yo soy una mujer.', ['Soy una mujer.'], ['Sono una donna.']),
          s('Lui è un bambino.', 'Él es un niño.', ['Es un niño.'], ['È un bambino.']),
          s('Lei è una bambina.', 'Ella es una niña.', ['Es una niña.'], ['È una bambina.']),
          s('Tu sei un uomo.', 'Tú eres un hombre.', ['Eres un hombre.'], ['Sei un uomo.']),
        ]),
        lesson('es-u1-l3', 'Cibo', [
          w('mela', 'manzana', '🍎'), w('pane', 'pan', '🍞'), w('acqua', 'agua', '💧'),
          w('latte', 'leche', '🥛'), w('formaggio', 'queso', '🧀'),
        ], [
          s('Io mangio una mela.', 'Yo como una manzana.', ['Como una manzana.'], ['Mangio una mela.']),
          s('Lei beve acqua.', 'Ella bebe agua.', ['Bebe agua.']),
          s('Il bambino mangia pane.', 'El niño come pan.', [], ['Il bambino mangia il pane.']),
          s('Noi beviamo latte.', 'Nosotros bebemos leche.', ['Bebemos leche.'], ['Beviamo latte.']),
        ]),
      ],
    },
    {
      id: 'es-u2',
      title: 'Intorno a me',
      description: 'Animali, colori e famiglia',
      lessons: [
        lesson('es-u2-l1', 'Animali', [
          w('cane', 'perro', '🐶'), w('gatto', 'gato', '🐱'), w('uccello', 'pájaro', '🐦'),
          w('cavallo', 'caballo', '🐴'), w('pesce', 'pez', '🐟'),
        ], [
          s('Il gatto beve latte.', 'El gato bebe leche.'),
          s('Ho un cane.', 'Tengo un perro.', ['Yo tengo un perro.'], ['Io ho un cane.']),
          s('Il cavallo è grande.', 'El caballo es grande.'),
          s("L'uccello è piccolo.", 'El pájaro es pequeño.'),
        ]),
        lesson('es-u2-l2', 'Colori', [
          w('rosso', 'rojo', '🔴'), w('blu', 'azul', '🔵'), w('verde', 'verde', '🟢'),
          w('giallo', 'amarillo', '🟡'), w('nero', 'negro', '⚫'),
        ], [
          s('La mela è rossa.', 'La manzana es roja.'),
          s('Il mio cane è nero.', 'Mi perro es negro.'),
          s('Il sole è giallo.', 'El sol es amarillo.'),
          s('La porta è blu.', 'La puerta es azul.'),
        ]),
        lesson('es-u2-l3', 'Famiglia', [
          w('madre', 'madre', '👩'), w('padre', 'padre', '👨'), w('sorella', 'hermana', '👭'),
          w('fratello', 'hermano', '👬'), w('nonna', 'abuela', '👵'),
        ], [
          s('Mio padre legge un libro.', 'Mi padre lee un libro.'),
          s('Ho una sorella.', 'Tengo una hermana.', ['Yo tengo una hermana.']),
          s('Lui è mio fratello.', 'Él es mi hermano.', ['Es mi hermano.']),
          s('Mia nonna cucina la pasta.', 'Mi abuela cocina la pasta.', ['Mi abuela cocina pasta.']),
        ]),
      ],
    },
  ],
}

export const courses: Course[] = [
  english, spanish, french, german, portuguese, polish, chinese, japanese,
  korean, russian, greek, dutch, swedish, turkish, romanian,
]

export function getCourse(id: string | null): Course | undefined {
  return courses.find((c) => c.id === id)
}

export function allLessons(course: Course): LessonDef[] {
  return course.units.flatMap((u) => u.lessons)
}

export function findLesson(course: Course, lessonId: string): LessonDef | undefined {
  return allLessons(course).find((l) => l.id === lessonId)
}
