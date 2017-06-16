md5=function(){for(var m=[],l=0;64>l;)m[l]=0|4294967296*Math.abs(Math.sin(++l));return function(c){var e,g,f,a,h=[];c=unescape(encodeURI(c));for(var b=c.length,k=[e=1732584193,g=-271733879,~e,~g],d=0;d<=b;)h[d>>2]|=(c.charCodeAt(d)||128)<<8*(d++%4);h[c=16*(b+8>>6)+14]=8*b;for(d=0;d<c;d+=16){b=k;for(a=0;64>a;)b=[f=b[3],(e=b[1]|0)+((f=b[0]+[e&(g=b[2])|~e&f,f&e|~f&g,e^g^f,g^(e|~f)][b=a>>4]+(m[a]+(h[[a,5*a+1,3*a+5,7*a][b]%16+d]|0)))<<(b=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21][4*b+a++%4])|f>>>32-b),e,g];for(a=4;a;)k[--a]=k[a]+b[a]}for(c="";32>a;)c+=(k[a>>3]>>4*(1^a++&7)&15).toString(16);return c}}();
var lY = {
   seed: '',
   pos: 0,
   alphabet: [
      ['b', 'c', 'ch', 'd', 'dd', 'f', 'ff', 'g', 'ng', 'h', 'l', 'll', 'm', 'n', 'p', 'ph', 'r', 'rh', 's', 't', 'th'],
      ['a', 'e', 'i', 'o', 'u', 'w', 'y']
   ],
   paragraph: [],
   
   refreshSeed: function(salt)
	{
		this.seed = md5(this.seed + salt);
	},
   
   getSeedValue: function(length)
	{
		length = Math.min(this.seed.length, length);
		
		var extract = this.seed.substr(this.pos, length);
		
		this.pos += length;
		
		if (extract.length < length)
		{
			extract += this.seed.substr(0, length - extract.length);
			this.pos = length - extract.length;
		}
		
		this.refreshSeed(extract);
		
		return parseInt(extract, 16);
	},
	
	getLetter: function(type)
	{
		return this.alphabet[type][parseInt(this.getSeedValue(3) * (this.alphabet[type].length - 1) / 4096)];
	},
   
   addSentence: function(sentence)
   {
      // Capitalise first characters of sentences
      sentence = sentence.join(' ');
      this.paragraph.push(sentence.charAt(0).toUpperCase() + sentence.slice(1));
   },
   
   getText: function(words)
   {
      var sentence = [];
      var word = 'Llorem';
      this.seed = word;
      sentence.push(word);
      word = 'ypswm';
      this.refreshSeed(word);
      sentence.push(word);
      var type = null;
      var type_count;
      var new_type;

      for (var w = 1; w <= words; ++w)
      {
         // Choose word length
         length = parseInt(this.getSeedValue(3) * 10 / 4096) + 1;
         word = '';
         type_count = 0;
         for (var l = 1; l <= length; ++l)
         {
            // Pick a consonant or vowel
            if (type_count >= 2)
            {
               type = 1 - type;
               type_count = 1;
            }
            else
            {
               new_type = (length === 1)
                  ? 1
                  : (
                     (this.getSeedValue(1) < 7 + (type_count * 6 - 3))
                     ? 0
                     : 1);
               if (type === new_type)
               {
                  ++type_count;
               }
               else
               {
                  type_count = 1;
               }
               type = new_type;
            }
            word += this.getLetter(type);
         }
         // Maybe add some commas, fullstops.
         if (sentence.length && this.getSeedValue(1) < 1)
         {
            sentence.push(word);
            this.addSentence(sentence);
            sentence = [];
         }
         else
         {
            if (this.getSeedValue(1) < 1)
            {
               word += ',';
            }
            sentence.push(word);
         }
      }
      this.addSentence(sentence);
      return this.paragraph.join('. ') + '.';
   }
};

// Get specified or random number of words
var words = window.location.search.replace(/^\?(\d*).*$/gi, '$1') || 0;
if (!words) words = parseInt(Math.random() * 100);

document.write(lY.getText(words));