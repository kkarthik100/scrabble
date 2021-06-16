# Scrabble

# What is it?

Back in 2010, my work at Google as a software engineer was heavily C++ and
Javascript oriented. The JS code was very I/O bound, which is typical of the
applications that JS is used for. I wanted to build something that was more
CPU bound to see if JS performed well on computationally intensive tasks
that ran in a web browser.

And we all know that board games (think Chess or Go) are a great way to burn
CPU cycles, until you are forced to get a new machine. Armed with that thought,
I considered tackling the game of Scrabble, partly because at that point in
my life, I was playing it quite often and also because it was something I had
never attempted before.

# Try it out

https://kkarthik100.github.io/scrabble/

To play, drag each letter to the board until you have formed the word you are thinking of. Then hit the **Play** button.

# The user interface

If you try the game out, you will see that it is quite playable. I also think
the animations are quite decent. Having said that, my original intent was not
to create a prettified version for public consumption and hence, the UI can
be made a lot more pretty with themes and so forth. This is left as an
exercise for the forker.

# Technicals

There is fairly heavy use of the *trie* data structure and recursion to
compute power sets and permutations of the letters in the AI player's rack.
The fact that letters in the player's rack can repeat somewhat complicates
the above computations. Study the code in ai.js carefully.

The code was originally written back in 2010 when *modern* JS (ES6 and later)
did not exist. It used Google's Closure Compiler back then. However, I
recently modularized the code (via ES6 import / export syntax) and bundled it
with webpack (see the file **scrabble.js**).

Start with these commands to try out webpack:
  * sudo apt install webpack
  * webpack --mode=development game.js
  * webpack game.js

The game is very playable and (hopefully) enjoyable. However, I never had the
time to finish it up cleanly (as this was a hobby project done outside of
work hours). To this effect, see the TODO.txt file where I have listed the
tasks that got left out.

# Why bother now?

There are plenty of scrabble engines out there. So why bother with one that
was written more than a decade ago? Well, if you want to build a world class
scrabble engine, start small first. Studying the code here is a good first
step. More interestingly, if you work in a company as a software engineer and conduct
technical interviews, you will find quite a few interesting problems that
are encountered here, such as computing permutations with repetitions, efficient
dictionary lookups, efficient move generation and so on.

# Contact

Send feedback or suggestions to kkarthik100@gmail.com
