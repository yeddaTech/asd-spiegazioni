# ASD spiegato bene

Spiegazioni delle lezioni di **Algoritmi e Strutture Dati**. Ogni pagina raccoglie un gruppo di argomenti, spiegati con calma e con riquadri interattivi da provare.

👉 **Apri il sito: <https://yeddatech.github.io/asd-spiegazioni/>**

## Cosa c'è

| Pacco | Argomenti | Lezioni |
|---|---|---|
| 0 · Primi passi | algoritmi, induzione, moltiplicazione e potenza, O, Ω e Θ, quante cifre ha un numero | 1–4 |
| 1 · Quanto costa un algoritmo | modello RAM, criteri di costo, caso peggiore e medio, polinomiale contro esponenziale | 4–5 |
| 2 · Array e riferimenti | array, accesso in Θ(1), passaggio per valore e per riferimento, array e slice in Go | 5–6 |
| 3 · Cercare in un array | ricerca sequenziale e binaria, record di attivazione | 6–7 |
| 4 · Mettere in ordine | selectionSort, insertionSort, bubbleSort, stabilità | 7–8 |
| 5 · Dividi e fondi: mergeSort | merge, divide et impera, albero delle chiamate | 8 |
| 6 · Quanto costa mergeSort | l'equazione C(n), il tempo T(n), l'altezza della pila, il Codice 3.3 | 9 |
| 7 · Divide et impera e teorema fondamentale | minMax, Master theorem, prodotto di matrici, Strassen | 10 |
| 8 · QuickSort | partizione con il perno, i tre casi (peggiore, migliore, medio), esercizi d'esame sulla partizione | 11 |
| 9 · Quanto spazio usa quickSort | la pila delle chiamate, il caso peggiore, la ricorsione in coda, la parte più piccola per prima | 12 |
| 10 · Le liste concatenate | tipi di dato e strutture dati, ricerca, inserimento e cancellazione, liste in C e in Go | 12–14 |
| 11 · Pile e code | LIFO e FIFO, realizzazioni con array (anche circolare) e con liste, costi | 13–14 |
| 12 · Alberi binari e visite | nomi, rappresentazione, visite in ampiezza e in profondità, tre ordini, notazione polacca inversa, visite dei temi d'esame | 13–14 |
| 13 · Heap e creaHeap | alberi quasi completi e altezza ⌊log₂ n⌋, heap, risistema, creaHeap ricorsivo e dal basso in Θ(n), heapSort sull'albero, max-heap e min-heap dei temi d'esame | 15 |
| 14 · heapSort in loco | vettore posizionale, heap e parte ordinata nello stesso array, risistema e creaHeap con gli indici, non stabilità, ordine decrescente, le domande d'esame su heapSort | 16 |
| 15 · Limite n log n e ordinare senza confrontare | riepilogo degli ordinamenti, alberi di decisione e limite log₂(n!), integerSort, bucketSort, ordinamento per più chiavi, radixSort, cifre con shift e AND | 16–17 |
| 16 · Operazioni sugli heap, code con priorità, analisi ammortizzata | togli la radice, inserisci, cancella, cambia chiave, min-heap come coda con priorità, deleteMin e changeKey dei temi d'esame, contatore binario | 17–18 |
| 17 · Union-find | partizioni, QuickFind e bilanciamento, QuickUnion, union by rank e il lemma, compressione dei cammini, log* n, esercizio 7.1 | 18–19 |
| 18 · Grafi: parole, rappresentazioni, alberi e visite | definizioni, gradi, cammini e connessione, Eulero e Hamilton, liste e matrici, M^k, alberi e alberi ricoprenti, visita in ampiezza e in profondità e il loro tempo | 19–21 |
| 19 · Problemi di ottimizzazione e tecnica greedy | grafi pesati, soluzioni ammissibili e ottime, colorazione, zaino, sacco del ladro, resto, schema greedy e controesempi, foglio 9 | 21 |
| 20 · Albero ricoprente minimo: Kruskal e Prim | Kruskal e la sua correttezza, union-find, O(m log n), Prim con d e vicino e la coda con priorità, gli scritti su Kruskal | 22–23 |
| 21 · La programmazione dinamica | Fibonacci ricorsivo e con l'array, cammino minimo su matrice, la matrice C, lo schema generale, scritto del 6/2/2026 | 24 |
| 22 · Cammini minimi e Floyd–Warshall | definizioni, principio di ottimalità, matrice dei pesi, Floyd–Warshall con P, cicli negativi, sette scritti | 24–25 |
| 23 · Bellman–Ford e Dijkstra | aggiornamento, Bellman–Ford, Dijkstra con dimostrazione e coda con priorità, pred e albero dei cammini minimi, pesi negativi, gli scritti | 25–26 |
| 24 · Alberi binari di ricerca | definizione, ricerca, minimo e massimo, inserimento, cancellazione, costo Θ(h), gli scritti | 26–27 |
| 25 · Alberi bilanciati e AVL | perfettamente bilanciati, AVL, alberi di Fibonacci, rotazioni semplici e doppie, gli scritti | 27–28 |
| 26 · Alberi 2-3 e B-alberi | alberi 2-3, instradamento, split, nodi minimi e massimi, B-alberi e accessi al disco, gli scritti | 28–29 |
| 27 · Tabelle hash | accesso diretto, fattore di carico, uniformità, divisione e ripiegamento, liste di collisione, indirizzamento aperto | 29–30 |

## Come si usa

- **Online:** apri il link qui sopra e parti da un pacco.
- **Offline:** scarica la repo (*Code → Download ZIP*), estraila e apri `index.html`. Funziona anche senza internet, perché non usa librerie esterne.
- Ogni pagina comincia con una mappa della lezione e finisce con il riassunto, i consigli per l'esame e gli esercizi con la soluzione nascosta.
- I riquadri viola «Dai tuoi appunti» rispondono ai dubbi scritti negli appunti di chi ha creato la repo.
- **Lettura ad alta voce:** seleziona un pezzo di testo e premi «Leggi». La voce è quella del dispositivo (le più naturali: Edge, Chrome, telefono, Safari); le formule vengono dette per esteso.

## Nota

Sono appunti di studio personali, non materiale ufficiale: in caso di dubbio fa fede il materiale del corso.
