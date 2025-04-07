class OpenRouterService {
  constructor() {
    this.siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tummy-time.app';
    this.siteName = 'Tummy Time Baby Care Assistant';
    this.currentModel = "openai/gpt-3.5-turbo";
    
    // Inappropriate content terms to be filtered out
    this.INAPPROPRIATE_TERMS = [
      'sex', 'sexual', 'sexually', 'porn', 'pornography', 'explicit', 'nude', 'nudity', 'naked',
      'adult content', 'mature content', 'xxx', 'nsfw', 'erotic', 'obscene', 'fetish', 'kink',
      'masturbate', 'masturbation', 'intercourse', 'prostitution', 'escort', 'drug', 'drugs',
      'cocaine', 'heroin', 'meth', 'marijuana', 'weed', 'illegal', 'abuse', 'violent', 'violence',
      'weapon', 'weapons', 'kill', 'killing', 'murder', 'suicide', 'rape', 'molest', 'molestation',
      'assault', 'pornographic', 'gambling', 'bet', 'betting', 'casino', 'alcohol', 'drunk',
      'intoxicated', 'cigarette', 'tobacco', 'vape', 'vaping', 'inappropriate'
    ];
    
    // Comprehensive dictionary of child-related topics and keywords
    this.CHILD_KEYWORDS = [
      // General terms for children
      'baby', 'babies', 'infant', 'infants', 'toddler', 'toddlers', 'child', 'children', 'kid', 'kids',
      'newborn', 'newborns', 'neonate', 'neonates', 'preemie', 'premature', 'little one', 'little ones',
      'youngster', 'young one', 'childhood', 'preschooler', 'preschoolers', 'nursery', 'daycare',
      'offspring', 'son', 'daughter', 'twins', 'triplets', 'multiples', 'sibling', 'siblings'
    ];
    
    // Age-specific terms
    this.AGE_KEYWORDS = ['month old', 'months old', 'year old', 'years old', 'weeks old', 'week old', 
      'day old', 'days old', '0-7', 'age', 'aged', 'toddlerhood', 'infancy', 'baby years'];
    
    // Comprehensive dictionary of child-related topics and keywords
    this.CONVERSATION_TOPICS = {
      feeding: [
        'feeding', 'eat', 'eating', 'food', 'foods', 'meal', 'meals', 'snack', 'snacks', 'appetite', 
        'hungry', 'hunger', 'formula', 'formulas', 'breastfeed', 'breastfeeding', 'breast feed', 
        'breast feeding', 'breastmilk', 'breast milk', 'milk', 'bottle', 'bottles', 'nursing', 'nurse', 
        'nutrition', 'nutrient', 'nutrients', 'nourishment', 'solids', 'solid food', 'puree', 'weaning', 
        'spoon', 'spoon-feeding', 'highchair', 'high chair', 'bib', 'bibs', 'sippy cup', 'drink', 
        'drinking', 'thirsty', 'hydration', 'dehydration', 'choking', 'gag', 'gagging', 'chew', 'chewing',
        'swallow', 'swallowing', 'spit', 'spitting', 'regurgitate', 'spit up', 'spit-up', 'burp', 'burping',
        'reflux', 'gerd', 'cereal', 'vegetable', 'vegetables', 'fruit', 'fruits', 'protein', 'finger food',
        'picky', 'picky eater', 'lactose', 'allergy', 'allergies', 'intolerance', 'organic'
      ],
      sleep: [
        'sleep', 'sleeping', 'nap', 'napping', 'bedtime', 'night', 'overnight', 'wake', 'waking', 'awake',
        'tired', 'drowsy', 'exhausted', 'fatigue', 'rest', 'resting', 'routine', 'crib', 'cribs', 'bassinet',
        'cosleep', 'co-sleep', 'bed', 'bedshare', 'bed-sharing', 'swaddle', 'swaddling', 'dream', 'dreaming',
        'nightmare', 'night terror', 'snore', 'snoring', 'apnea', 'sids', 'breathing', 'monitor', 'schedule',
        'insomnia', 'pillow', 'blanket', 'mattress', 'bedding', 'pajamas', 'pacifier', 'soother', 'dummy',
        'comfort object', 'lovey', 'stuffed animal', 'lullaby', 'white noise', 'nursery', 'dark', 'darkness'
      ],
      development: [
        'development', 'milestone', 'milestones', 'growth', 'growing', 'grow', 'progress', 'skill', 'skills',
        'ability', 'abilities', 'crawl', 'crawling', 'walk', 'walking', 'talk', 'talking', 'speech', 'roll',
        'rolling', 'sit', 'sitting', 'stand', 'standing', 'motor', 'gross motor', 'fine motor', 'cognitive',
        'social', 'emotional', 'language', 'verbal', 'nonverbal', 'hand-eye', 'coordination', 'learn', 'learning',
        'brain', 'intelligence', 'smart', 'genius', 'gifted', 'behind', 'advanced', 'precocious', 'early',
        'late', 'delay', 'delayed', 'regression', 'head control', 'grasp', 'grasping', 'reach', 'reaching',
        'babble', 'babbling', 'coo', 'cooing', 'word', 'words', 'vocabulary', 'understand', 'understanding',
        'comprehension', 'jump', 'jumping', 'climb', 'climbing', 'run', 'running', 'play', 'playing'
      ],
      health: [
        'health', 'healthy', 'sick', 'illness', 'fever', 'temperature', 'thermometer', 'rash', 'rashes',
        'cough', 'coughing', 'cold', 'flu', 'virus', 'infection', 'bacterial', 'antibiotic', 'medicine',
        'medication', 'prescription', 'doctor', 'pediatrician', 'hospital', 'emergency', 'er', 'clinic',
        'checkup', 'check-up', 'appointment', 'symptom', 'symptoms', 'vaccine', 'vaccination', 'immunization',
        'shot', 'shots', 'ear infection', 'strep', 'rsv', 'covid', 'coronavirus', 'flu', 'influenza',
        'chickenpox', 'measles', 'mumps', 'rubella', 'meningitis', 'vomit', 'vomiting', 'diarrhea', 'constipation',
        'dehydration', 'hydration', 'congestion', 'runny nose', 'stuffy nose', 'sneeze', 'sneezing', 'wheeze',
        'wheezing', 'breathe', 'breathing', 'asthma', 'allergy', 'allergies', 'allergic', 'rash', 'hives',
        'eczema', 'diaper rash', 'cradle cap', 'jaundice', 'thrush', 'anemia', 'pain', 'discomfort', 'injury',
        'hurt', 'bruise', 'cut', 'wound', 'bleeding', 'blood', 'first aid', 'emergency', 'weight', 'height',
        'growth chart', 'percentile', 'bmi', 'eyes', 'vision', 'hearing', 'ear', 'ears', 'nose', 'throat',
        'tummy', 'stomach', 'belly', 'intestine', 'gut', 'digestion', 'digestive', 'skin', 'bath', 'bathing',
        'hygiene', 'clean', 'germs', 'bacteria', 'sanitize', 'sunburn', 'sunscreen', 'vitamin', 'supplement',
        'bite', 'biting', 'scratch', 'scratching', 'pinch', 'pinching'
      ],
      behavior: [
        'behavior', 'behaviour', 'temperament', 'personality', 'mood', 'cry', 'crying', 'scream', 'screaming',
        'fussy', 'fussiness', 'irritable', 'irritability', 'colic', 'colicky', 'tantrum', 'tantrums', 'meltdown',
        'fit', 'discipline', 'punish', 'punishment', 'time-out', 'timeout', 'consequence', 'calm', 'calming',
        'soothe', 'soothing', 'comfort', 'comforting', 'console', 'consoling', 'upset', 'anger', 'angry',
        'frustration', 'frustrated', 'happy', 'happiness', 'sad', 'sadness', 'fear', 'afraid', 'scared',
        'anxious', 'anxiety', 'secure', 'insecure', 'attachment', 'clingy', 'independent', 'separation anxiety',
        'stranger anxiety', 'shy', 'shyness', 'outgoing', 'confidence', 'self-esteem', 'curiosity', 'curious',
        'explore', 'exploring', 'habit', 'routine', 'schedule', 'stubborn', 'determined', 'willful', 'defiant',
        'obedient', 'listen', 'listening', 'follow directions', 'rule', 'rules', 'boundary', 'boundaries',
        'limit', 'limits', 'share', 'sharing', 'take turns', 'cooperate', 'cooperation', 'aggressive',
        'aggression', 'hit', 'hitting', 'bite', 'biting', 'kick', 'kicking', 'push', 'pushing', 'pull',
        'pulling', 'pinch', 'pinching', 'scratch', 'scratching', 'throw', 'throwing', 'whine', 'whining',
        'demand', 'demanding', 'attention', 'ignore', 'ignoring', 'distract', 'distraction'
      ],
      teething: [
        'teeth', 'tooth', 'teething', 'gum', 'gums', 'drool', 'drooling', 'chew', 'chewing', 'bite', 'biting',
        'nip', 'nipping', 'gnaw', 'gnawing', 'teether', 'teething ring', 'teething toy', 'oral', 'mouth',
        'dental', 'dentist', 'pediatric dentist', 'cavity', 'cavities', 'decay', 'brush', 'brushing',
        'toothbrush', 'toothpaste', 'floss', 'flossing', 'fluoride', 'molar', 'molars', 'incisor', 'incisors',
        'canine', 'canines', 'baby teeth', 'primary teeth', 'deciduous teeth', 'permanent teeth', 'adult teeth',
        'loose tooth', 'lost tooth', 'swollen gums', 'sore gums', 'teething pain', 'teething gel',
        'teething medication', 'teething symptoms', 'fever while teething', 'numbing', 'frozen', 'cold'
      ],
      diapering: [
        'diaper', 'diapers', 'diapering', 'change', 'changing', 'wet', 'soiled', 'dirty', 'poop', 'pooping',
        'bowel movement', 'pee', 'urinate', 'urination', 'urine', 'stool', 'stools', 'feces', 'excrement',
        'wipe', 'wipes', 'baby wipes', 'rash', 'diaper rash', 'cream', 'ointment', 'powder', 'disposable',
        'cloth diaper', 'cloth diapers', 'potty', 'potty training', 'toilet', 'toilet training', 'accident',
        'accidents', 'regression', 'pull-up', 'pull-ups', 'training pants', 'underwear', 'bathroom', 'restroom'
      ],
      safety: [
        'safety', 'safe', 'danger', 'dangerous', 'hazard', 'hazardous', 'risk', 'risky', 'protect', 'protection',
        'childproof', 'babyproof', 'baby-proof', 'child-proof', 'lock', 'locks', 'gate', 'gates', 'fence',
        'rail', 'railing', 'monitor', 'monitors', 'supervision', 'supervise', 'watch', 'accident', 'emergency',
        'injury', 'injuries', 'first aid', 'cpr', 'choke', 'choking', 'fall', 'falling', 'drown', 'drowning',
        'burn', 'burning', 'fire', 'poison', 'poisonous', 'toxic', 'car seat', 'carseat', 'booster seat',
        'stroller', 'carrier', 'sling', 'helmet', 'pad', 'pads', 'window', 'door', 'stairs', 'steps',
        'outlet', 'outlets', 'cord', 'cords', 'blind', 'blinds', 'curtain', 'curtains', 'furniture',
        'cabinet', 'drawer', 'pool', 'swimming', 'water', 'street', 'road', 'traffic', 'car', 'vehicle',
        'stranger', 'abduction', 'wander', 'wandering', 'lost', 'id', 'identification', 'allergic reaction',
        'epipen', 'emergency plan', 'emergency contact'
      ],
      education: [
        'learn', 'learning', 'education', 'educational', 'teach', 'teaching', 'school', 'preschool',
        'pre-k', 'kindergarten', 'daycare', 'day care', 'childcare', 'child care', 'caregiver', 'babysitter',
        'nanny', 'au pair', 'teacher', 'classroom', 'curriculum', 'lesson', 'activity', 'activities',
        'play', 'playing', 'toy', 'toys', 'game', 'games', 'book', 'books', 'read', 'reading', 'story',
        'stories', 'rhyme', 'rhymes', 'song', 'songs', 'music', 'art', 'craft', 'crafts', 'draw', 'drawing',
        'color', 'coloring', 'paint', 'painting', 'create', 'creating', 'creativity', 'imagination',
        'imaginative', 'pretend', 'role play', 'puzzle', 'puzzles', 'block', 'blocks', 'building',
        'letter', 'letters', 'number', 'numbers', 'count', 'counting', 'shape', 'shapes', 'color', 'colors',
        'alphabet', 'literacy', 'numeracy', 'science', 'nature', 'outdoor', 'screen time', 'digital',
        'tablet', 'app', 'apps', 'video', 'television', 'tv', 'computer', 'smartphone', 'homeschool',
        'home school', 'tutor', 'tutoring', 'enrich', 'enrichment', 'gifted', 'advanced', 'early childhood'
      ],
      parenting: [
        'parent', 'parenting', 'mother', 'mom', 'mommy', 'father', 'dad', 'daddy', 'guardian', 'caregiver',
        'care', 'raise', 'raising', 'upbringing', 'nurture', 'nurturing', 'bond', 'bonding', 'attachment',
        'love', 'loving', 'support', 'supporting', 'encourage', 'encouraging', 'praise', 'praising',
        'discipline', 'disciplining', 'teach', 'teaching', 'guide', 'guiding', 'role model', 'example',
        'advice', 'advise', 'help', 'helping', 'cope', 'coping', 'stress', 'stressed', 'overwhelmed',
        'exhausted', 'tired', 'fatigue', 'burnout', 'self-care', 'balance', 'work-life', 'guilt', 'shame',
        'worry', 'anxious', 'anxiety', 'depression', 'mental health', 'support', 'support group',
        'community', 'resources', 'service', 'services', 'program', 'programs', 'class', 'classes',
        'workshop', 'single parent', 'co-parent', 'coparent', 'shared custody', 'blended family',
        'adoptive', 'adoption', 'foster', 'fostering', 'surrogate', 'surrogacy', 'same-sex parents',
        'lgbtq', 'grandparent', 'grandparents', 'extended family', 'in-laws', 'cultural', 'tradition',
        'value', 'values', 'belief', 'beliefs', 'religion', 'religious', 'spiritual', 'philosophy',
        'approach', 'style', 'authoritative', 'authoritarian', 'permissive', 'free-range', 'helicopter',
        'tiger', 'attachment', 'gentle', 'positive', 'natural', 'conscious'
      ]
    };
  }

  setModel(modelKey) {
    return true;
  }

  createConversationTitle(userMessage) {
    if (!userMessage || typeof userMessage !== 'string') {
      return 'New conversation';
    }
    
    const normalizedMessage = userMessage.toLowerCase();
    
    if (normalizedMessage.length < 10 || 
        /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/.test(normalizedMessage)) {
      return 'New conversation';
    }
    
    const ageMatch = normalizedMessage.match(/(\d+)\s*(month|week|year|day)s?\s*(old)?/);
    let agePrefix = '';
    if (ageMatch) {
      agePrefix = `${ageMatch[1]} ${ageMatch[2]}${ageMatch[1] !== '1' ? 's' : ''}: `;
    }
    
    for (const [category, keywords] of Object.entries(this.CONVERSATION_TOPICS)) {
      for (const keyword of keywords) {
        if (normalizedMessage.includes(keyword)) {
          const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1);
          
          const keywordIndex = normalizedMessage.indexOf(keyword);
          const startIndex = Math.max(0, normalizedMessage.lastIndexOf(' ', Math.max(0, keywordIndex - 15)) + 1);
          const endIndex = Math.min(normalizedMessage.length, normalizedMessage.indexOf(' ', Math.min(normalizedMessage.length, keywordIndex + 15)));
          
          let relevantPhrase = normalizedMessage.substring(startIndex, endIndex > 0 ? endIndex : normalizedMessage.length);
          
          relevantPhrase = relevantPhrase
            .replace(/^(is|my|the|about|how|what|when|why|do|does|can|could|should|would)\s+/i, '')
            .replace(/[?.!,].*$/, '')
            .trim();
            
          if (relevantPhrase.length > 25) {
            relevantPhrase = relevantPhrase.substring(0, 22) + '...';
          }
          
          return `${agePrefix}${formattedCategory}: ${relevantPhrase}`;
        }
      }
    }
    
    // Check if query contains any child-related term
    for (const childTerm of this.CHILD_KEYWORDS) {
      if (normalizedMessage.includes(childTerm)) {
        // Extract key terms from the message
        const words = normalizedMessage.split(/\s+/);
        const keyTerms = words.filter(word => 
          word.length > 3 && 
          !['with', 'that', 'this', 'have', 'what', 'when', 'where', 'which', 'about', 'should'].includes(word)
        ).slice(0, 3).join(' ');
        
        if (keyTerms) {
          return `${agePrefix}Question about ${keyTerms}`;
        }
        
        // Fall back to a cleaned version of the message
        let cleanedMessage = normalizedMessage
          .replace(/^(is|my|the|about|how|what|when|why|do|does|can|could|should|would)\s+/i, '')
          .replace(/[?.!,].*$/, '')
          .trim();
        
        if (cleanedMessage.length > 30) {
          cleanedMessage = cleanedMessage.substring(0, 27) + '...';
        }
        
        return `${agePrefix}${cleanedMessage.charAt(0).toUpperCase() + cleanedMessage.slice(1)}`;
      }
    }
    
    // General fallback
    const words = normalizedMessage.split(/\s+/);
    const significantWords = words.filter(word => 
      word.length > 3 && 
      !['with', 'that', 'this', 'have', 'what', 'when', 'where', 'which', 'about', 'should'].includes(word)
    );
    
    if (significantWords.length > 0) {
      const keyWords = significantWords.slice(0, 3).join(' ');
      return `${agePrefix}Question about ${keyWords}...`;
    }
    
    const titleWords = words.slice(0, 4).join(' ');
    return `${titleWords}...`;
  }

  // Check if the message contains any inappropriate terms
  hasInappropriateContent(message) {
    if (!message) return false;
    
    const normalizedMessage = message.toLowerCase();
    return this.INAPPROPRIATE_TERMS.some(term => normalizedMessage.includes(term));
  }

  // Check that the message relates to baby/child care in a legitimate way
  isRelevantQuery(query) {
    if (!query || query.trim() === "") return false;
    
    const normalizedQuery = query.toLowerCase();
    
    // First check for inappropriate content
    if (this.hasInappropriateContent(normalizedQuery)) {
      return false;
    }
    
    // Check all child keywords first
    for (const term of this.CHILD_KEYWORDS) {
      if (normalizedQuery.includes(term)) {
        return true;
      }
    }
    
    // Check age-related keywords
    for (const term of this.AGE_KEYWORDS) {
      if (normalizedQuery.includes(term)) {
        return true;
      }
    }
    
    // Check all topic-specific keywords
    return Object.values(this.CONVERSATION_TOPICS).some(keywordList => 
      keywordList.some(keyword => normalizedQuery.includes(keyword))
    );
  }

  async generateResponse(prompt, conversationHistory = []) {
    try {
      // Check for inappropriate content first, before any other processing
      if (this.hasInappropriateContent(prompt)) {
        return "I'm an assistant focused on baby and child care topics. I can only provide information related to caring for children in appropriate ways. Please ask a question about infant care, child development, feeding, or other child-related topics.";
      }
      
      const isRelevant = this.isRelevantQuery(prompt);
      const conversationTitle = this.createConversationTitle(prompt);
      
      if (!isRelevant) {
        return "I'm specialized in helping with questions about babies and children ages 0-7. " +
               "If you have questions about feeding, growth, development, symptoms, or " +
               "other child-related topics, I'd be happy to assist. Could you please ask " +
               "a question related to infant or child care?";
      }
      
      // Enhanced system message to ensure appropriate responses
      const systemMessage = {
        role: "system",
        content: `You are an expert baby care assistant. You provide accurate, helpful advice for parents and caregivers of children ages 0-7. 
        You focus ONLY on infant and child care, feeding, development, health, and appropriate parenting topics. 
        Keep responses concise, friendly, and evidence-based.
        
        IMPORTANT: You must ONLY respond to questions related to appropriate baby and childcare. 
        If a query seems to be using childcare terminology but is actually asking about inappropriate, adult, violent, or other unrelated topics, 
        politely decline and redirect to appropriate childcare questions. 
        Never provide information that could be harmful to children or inappropriate in a childcare context.`
      };

      const userMessage = {
        role: "user",
        content: prompt
      };

      const messages = [systemMessage];
      
      if (conversationHistory.length > 0) {
        messages.push(...conversationHistory);
      }
      
      messages.push(userMessage);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.currentModel,
            messages: messages,
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        const responseClone = response.clone();
        
        if (!response.ok) {
          const errorData = await responseClone.json();
          throw new Error(errorData.message || 'Failed to generate response');
        }

        const data = await response.json();
        
        if (data && data.choices && data.choices.length > 0) {
          return data.choices[0].message.content;
        }
        
        throw new Error("No response generated from API");
      } catch (error) {
        console.error("Error generating response:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error generating response:", error);
      throw error;
    }
  }

  async isModelReady() {
    try {
      const response = await fetch('/api/chat/status', {
        method: 'GET',
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.status === 'ready';
    } catch (error) {
      console.error("Error checking model status:", error);
      return false;
    }
  }
}

const openRouterService = new OpenRouterService();
export default openRouterService;