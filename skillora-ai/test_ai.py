import spacy 
nlp = spacy.load("en_core_web_md") 
doc = nlp("I am a Web Developer experienced in React and Python.") 
print([(ent.text, ent.label_) for ent in doc.ents]) 
