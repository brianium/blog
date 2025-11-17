+++
title = "Cogs: Agents as Channels"
date = "2025-11-13T10:58:42-05:00"
#dateFormat = "2006-01-02" # This value can be configured for per-post date formatting
author = "Brian Scaturro"
cover = "channel.gif"
tags = ["clojure", "realtime", "ai"]
keywords = false
description = "A deep dive into treating LLM-powered agents as core.async-style channels in Clojure—using context, transition functions, and tooling to build rich, composable, and stateful workflows."
showFullContent = false
readingTime = false
hideComments = false
+++

LLM based applications are inherently workflow oriented. All of our favorite tools and services in this new glorious age are predicated upon us messaging an agent and then waiting for a response. Sometimes we have to wait for a while because those agents are using tools or messaging other agents that have access to different tools.

Clojure's [core.async](https://clojure.github.io/core.async/rationale.html) was made for this sort of coordination. It provides an excellent set of tools for creating async workflows. The stated purpose being "to provide facilities for independent threads of activity, communicating via queue-like channels".

I think core.async is such a great fit for the agent based future that I have been tinkering with the concept of using agents as channels (or maybe channels as agents?) in Clojure. I want an agent that quacks just like a core.async channel. It should support the same operations of putting and taking values. The only difference is there is a big brain in the middle of those operations.

I am writing this article as a Clojure developer to other Clojure developers. I am assuming some familiarity with Clojure. I recommend firing up a REPL and trying things out 🎉

## Cogs

I am trying to focus more on a pattern than a specific tool or library, but I have enshrined my tinkering in a library called Cog Town. I will be making some references to this library, but the implementations within are not terribly complex.

The point of the library is to expose a "cog" type that serves as an agent that can be used like any other core.async channel. It also includes some helpers for more complex workflows.

```clojure
(require '[clojure.core.async :as a])
(require '[cog.town :as ct])

(defn cog
  "create a cog from a string"
  [prompt]
  (ct/cog [{:role :system :content prompt}] gpt-4o))

(def idea-guy
  (cog "You come up with an idea for a ridiculous product"))

(a/put! idea-guy {:role :user :content "Give me an idea for pillows"})
(a/take! idea-guy println) ;;; prints a totally great pillow idea
```

I have really enjoyed dropping these agent channels into the core.async style I know and love in order to build [conversational agents](https://github.com/brianium/cog-town/blob/main/dev/workflows/conversation.clj), listen in on [audible debates between agents](https://github.com/brianium/cog-town/blob/main/dev/workflows/debate.clj), and bust perps with [multimodal agents that speak and show things](https://github.com/brianium/cog-town/blob/main/dev/workflows/multimodal.clj).

## Glossary of Terms

**channel:**
A blocking unit that you can put messages onto, and take messages from. See the rationale for a thorough explanation.

**agent:**
There are probably a million competing definitions for this one, but I'll provide one for the purpose of this article. An agent has:

1. separate input and output streams (input/output modalities)
2. context - that is state. LLMs provide the means by which agents transition from one state to the next.
3. access to to tools (agents must do things)

**cog:**
A cog is an agent AND a channel. Message in. Message out. Big brain in the middle. An agent you can drop into a typical core.async workflow

## Separate Input and Output Streams

An agent might understand any number of inputs: text, bytes, urls, etc. By the same token, an agent might produce different outputs: text, images, speech, etc.

A typical core.async channel serves as both a read port and a write port. We put values on the channel and take them off.

```clojure
(require '[clojure.core.async :as a :refer [chan]])

(def ch (chan))
(a/put! ch "hello")
(a/take! ch println) ;;; prints "hello"
```

Channels can be constructed with [transducers](https://clojure.org/reference/transducers), allowing us to transform the values we take from them.

```clojure
(require '[clojure.core.async :as a :refer [chan]])
(require '[clojure.string :as string])

;;; map without a collection returns a transducer
(def xf (map string/capitalize))

;;; transducers require a buffer (buffer of length 1 in this case)
(def ch (chan 1 xf))

(a/put! ch "hello")
(a/take! ch println) ;;; prints "Hello"
```

This is fine for a typical producer/consumer pair, but an LLM-driven agent is not a simple producer/consumer pair. Prompt inputs arrive as quickly as possible - often as strings or maps without transformation. Completion output may be streamed token-by-token, chunked, may need a different buffer size, may be tapped by several consumers, and is more frequently transformed (parsed as json, deltas folded into single output, etc).

A single channel is going to give us some issues with back pressure. It will also complicate how we handle the different needs of input and output. Using multiple channels will make client code noisier and give us mere humans more to worry about. What I really want is two channels to behave as one. Enter the io channel.

```clojure
(require '[clojure.core.async :as a :refer [chan]])
(require '[cheshire.core :as json])
(require '[cog.town :refer [io-chan]]) 

(def as-json (map #(json/parse-string % keyword))
(def in (chan))
(def out (chan 1 as-json))
(def io (io-chan in out))

;;; puts go to the underlying in channel
(a/put! io "{\"content\": \"hello\"}")

;;; takes are from the underlying out channel
(a/take! io (comp println :content)) ;;; prints "hello"
```

Because reads and writes hit different underlying queues, slow consumers can’t block the arrival of the next prompt.

A cog is just such a channel, but it is composed with context (state) and the means by which that context transitions from one state to the next.

## Context Is State

![Obviously how context works](context.gif)

An agent’s context _is_ the agent’s state. It is more or less a log of every input received and every output generated. A cog is an io channel composed of context and a transition function.

```clojure
(require '[clojure.core.async :as a])
(require '[cog.town :as ct :refer [cog]])

(defn gpt-4o
  "A transition function leveraging GPT 4o"
  [context input]) ;;; return [new-context, output] tuple

(def state
  [{:role :system :content "You are a helpful assistant"}]

(def assistant (cog state gpt-4o))

(a/put! assistant {:role :user :content "What is 3 + 7"})
(a/take! assistant println) ;;; Outputs the return value of gpt-4o

@assistant ;;; => [{:role :system ....} {:role :user ...}]
```

A cog is intentionally ignorant about what context is. Use case should determine how context is stored and what message formats are used. This is far more flexible than contriving a universal context protocol or a codified message format (though this approach does not prohibit using either). The contract is entirely between context and the cog's transition function.

```
transition :: (context, input) -> [new-context, output]
```

I am partial to plain Clojure data structures, but there is nothing preventing the use of something mutable here. Maybe we want to store context in a database, file, etc.

You can get cooking without much effort. The following example uses [oai-clj](https://github.com/brianium/oai-clj). A Complete Enough ™ library I am building for when I want to reach for OpenAI.

```clojure
(require '[oai-clj.core :as oai]) 

(defn gpt-4o
  [context input]
  (let [log-entries  (conj context input)
        response     (oai/create-response :model :gpt-4o :easy-input-messages log-entries)
        output-entry {:role    :assistant
                      :content (-> (:output response) first :message :content first :output-text :text)}]
    [(conj log-entries output-entry) output-entry]))
```

This transition function makes for a simple cog with context backed by GPT-4o.

```clojure
(def state [{:role :system :content "You are an accountant"}])
(def accountant (cog state gpt-4o))
(put! accountant {:role :user :content "How could you do this to me?!?!?!"})
(take! accountant println) 
;;; {:role :assistant :content "LOL! REKT"}
@cog 
;;; [{:role :user :content "How could you do this to me?!?!?!"}, {:role :assistant ...}]
```

## Tools: Your Computer Has Them!

![Tool! Tool! Tool!](tools.gif)

Agents should be able to do things. [MCP](https://modelcontextprotocol.io/docs/getting-started/intro) is super hot right now, and there is undoubtedly a lot of value in creating networks of discoverable tools for agents. 

When agents are a first class citizen of a program they have access to all of the tools your program has access to.

```
input -> agent -> literally any function
```

_literally any function_ can be used to do what functions always do. If _literally any function_ delegates work to another agent (or agents) then we have (probably) reached AGI internally.

Clojure's [schema game](https://github.com/metosin/malli) is unrivaled (fight me). Pair such game with something like [structured outputs](https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses) and we are the masters of our own tool destiny.

```clojure
(require '[clojure.java.process :as proc])
(require '[cheshire.core :as json])
(require '[oai-clj.core :as oai])

(defn gpt-4o-structured
  "create a transition supporting structured outputs"
  [fmt]
  (fn [context input]
    (let [log-entries  (conj context input)
          response     (oai/create-response :input-items log-entries :format fmt)
          output-entry {:role :assistant
                        :content (-> (:output response) first :message :content first :output-text :text)}]
      [(conj log-entries output-entry) output-entry])))

(def BashCommand
  "malli is love. malli is life"
  [:map
   [:dir {:description "The working directory to execute the command in. Use \".\" if directory not relevant"} :string]
   [:command {:description "A bash command as an array of parts - i.e [\"cat\" \"path\"]"} [:vector :string]]])

(def as-json
  "transducer to let our cog talk in Clojure maps"
  (map 
    (fn [output]
      (update output :content #(json/parse-string % keyword)))))

(def neckbeard
  "simply the best"
  (cog
   [{:role :system :content "You are the best system administrator. You give bash commands"}]
   (gpt-4o-structured 'BashCommand)
   1 as-json)) ;;; same as (chan) buffer and transducer

;;; staying safe with fun times
(a/put! neckbeard {:role :user :content "I need to echo \"fun times\" in my terminal"})
(a/take! neckbeard (fn [{{:keys [dir command]} :content}]
                     (println (apply proc/exec {:dir dir} command))))
```

We are living in the best times.

## Composition

![Everything is better with friends.](composition.gif)

Clojure's core.aysnc is great for building pipelines. Just look at the aptly named functions [pipeline](https://clojuredocs.org/clojure.core.async/pipeline), [pipeline-async](https://clojuredocs.org/clojure.core.async/pipeline-async), and [pipeline-blocking](https://clojuredocs.org/clojure.core.async/pipeline-blocking). If we aren't passing messages from channel to channel, then what are we even doing?

I want to briefly make the point that it is pretty cool AND awesome when an agent can be used like any other channel. One can bring their existing CSP/core.async chops to the table and quickly build agent workflows.

I don't want to spend too much time discussing the details; partly because I am skeptical anyone will make it to this point of the article, and partly because the implementations are pretty straightforward. Without further ado, some contrived (but fun!) examples using cog town.

```clojure
(require '[clojure.core.async :as a])
(require '[cog.town :as ct :refer [flow]])

(defn cog
  "create a cog from a string"
  [prompt]
  (ct/cog [{:role :system :content prompt}] gpt-4o))

(def idea-guy 
  (cog "You come up with an idea for a ridiculous product"))

(def marketing-guy
  (cog "Given a ridiculous product idea, you generate a slogan for it"))

(def product-team (flow [idea-guy marketing-guy]))

(a/put! product-team {:role :user :content "Give me your most ridiculous idea"})
(a/take! product-team println)
;;; "Scented Memory Pillow: Because every nap deserves a blast from the past!"
```

Indeed every nap DOES deserve a blast from the past. However, we need to go global babbbbbby.

```clojure
(require '[clojure.core.async :as a])
(require '[cog.town :as ct :refer [flow fanout]])

(defn cog
  "create a cog from a string"
  [prompt]
  (ct/cog [{:role :system :content prompt}] gpt-4o))

(def idea-guy
  (cog "You come up with an idea for a ridiculous product"))

(def marketing-guy
  (cog "Given a ridiculous product idea, you generate a slogan for it"))

(def product-team 
  (flow [idea-guy marketing-guy]))

(def japanese-translator
  (cog "You translate slogans into idiomatic Japanese"))

(def french-translator
  (cog "You translate slogans into idiomatic French"))

(def spanish-translator 
  (cog "You translate slogans into idiomatic Spanish (Spain)"))

(def translators
  (fanout [japanese-translator french-translator spanish-translator]))

(def global-inc
  (flow [product-team translators]))

(a/put! global-inc {:role :user :content "Give me your most ridiculous idea"})

(a/take! global-inc #(doseq [m %]
                           (println (:content m))))
;;; 「「切って、引いて、楽しさ満点—パンのスライスにひらめきを！」
;;;  "Tranche, Tire, Régale—La Découpe du Pain avec Éclat !"
;;;  "¡Corta, tira y disfruta—rebanando pan con sabiduría!"
```

We need those translators working in parallel; time is money.

And of course we can inspect the context of any cog involved:

```clojure
@japanese-translator

[{:role :system,
  :content "You translate slogans into idiomatic Japanese"}
 {:role :user,
  :content
  "### Slogan:\n\n\"Slice, Pull, Delight—Bread Slicing with Insight!\""}
 {:role :assistant, :content "「切って、引いて、楽しさ満点—パンのスライスにひらめきを！」"}]
 ```

## Forking

![Matthew 1:2-17](forking.gif)

I find it very useful to conduct "what-if" experiments without muddying up existing communication channels or context. It isn't very difficult to snag context, copy it, and use it in a new agent. 

Cog town includes a utility that does this, while also creating new communication channels so we can easily write to and read from both.

```clojure
(require '[clojure.core.async :as a])
(require '[cog.town :as ct :refer [fork]])

(defn cog
  "create a cog from a string"
  [prompt]
  (ct/cog [{:role :system :content prompt}] gpt-4o))

(def adder
  (cog "Given two numbers you add them"))

(a/put! adder "Add 3 and 7")
(a/take! adder println)
;;; {:role :assistant, :content "3 and 7 is 10"}

;;; new context, new channel
(def multipler
  (fork adder
    #(conj % {:role :user :content "Stop adding. You now multiply")))

(a/put! multiplier {:role :user :content "Actually, multiply the last two numbers instead"})
(a/take! multiplier println)
;;; {:role :assistant, :content "3 and 7 is 21"}
```

## Conclusion

I have been using these little building blocks to great effect lately. They serve as a great foundation for some really excellent workflows. I can envision these channels being a foundation for larger frameworks and tools. Maybe we want a more consistent context API or message format or stronger guarantees for our programs?

I'm still building upon the concept, but I've been able to do some things I've never been able to do before. Things like:

- Build a content agency that writes content, generates images and audio, and even publishes that content.
- Add multimodal agents backed by sqlite to my REPL workflow. Who doesn't want a little REPL buddy they can have an actual conversation with? Even better when they remember where you left off!
- Create self-correcting agents that execute code with feedback automatically returned to them.

I think core.async is a great tool for the times. I think it will [become even more so](https://clojure.org/news/2025/04/28/async_flow).

It is easy to dream big these days. If you made it this far, thank you so much for reading 🙇‍♂️
