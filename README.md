# AI Autocompletion from locally hosted llama.cpp

**Albus** is a locally hosted AI code completion plugin for Visual Studio Code, designed to work seamlessly with [🦙 llama.cpp Python API](https://github.com/abetlen/llama-cpp-python).

Albus is aptly named as your "wizard" programmer, since he is not casting spells, but definitely brewing up some magical AI code completion! 

![albus](https://raw.githubusercontent.com/abybaddi009/albus/077ef0bac33e853f7c408f06f25cd1beb4a955c2/assets/albus_small.png)

Our goal? To democratize the development of AI tools and make it as enchanting for everybody.

Accio, llamas! 🧙‍♀️✨

## 🚀 Getting Started

### Prerequisites

To make use of Albus properly, you will need to run the [🦙 llama.cpp Python API](https://github.com/abetlen/llama-cpp-python).

### Installation & Setup

#### Create a folder for your models

```bash
mkdir models
```
#### Download a suitable model from [🤗 Hugging Face](https://huggingface.co/) into this folder's model folder

Some good models in no particular order:

- https://huggingface.co/TheBloke/deepseek-coder-6.7B-instruct-GGUF
- https://huggingface.co/TheBloke/WizardCoder-Python-7B-V1.0-GGUF 
- https://huggingface.co/TheBloke/WizardCoder-Python-13B-V1.0-GGUF
- https://huggingface.co/TheBloke/XwinCoder-13B-GGUF/
- https://huggingface.co/TheBloke/XwinCoder-34B-GGUF/
- https://huggingface.co/TheBloke/Phind-CodeLlama-34B-v2-GGUF


#### Create and activate virtual environment (optional)
If you want to keep the server separate then create a virtual environment

```bash
python3 -m venv .env
```

#### Install API server with [🦙 llama.cpp Python](https://github.com/abetlen/llama-cpp-python)

```bash
pip3 install "llama-cpp-python[server]"
```

#### Run the server using

```bash
python3 -m llama_cpp.server --model models/deepseek-coder-6.7b-instruct.Q5_K_M.gguf --n_ctx 8192
```

#### Install the verified extension using vscode or visit [this link](https://marketplace.visualstudio.com/items?itemName=abybaddi009.albus) for more information on how to install it.

Enjoy enhanced code completions with **Albus**! 🎉

## Configuration

### General settings:

| Property                            | Type    | Default | Description                                                      |
|-------------------------------------|---------|---------|------------------------------------------------------------------|
| `albus.general.contextLength`       | number  | 500     | Number of characters to include in the context (default: 500 characters)|
| `albus.general.debounceWait`        | number  | 500     | Amount of time to wait before sending a request to the server (default: 500ms)|
| `albus.general.enabled`             | boolean | true    | Enable or disable the general functionality (default: true)     |

### Settings for llama.cpp server:

| Setting                         | Type    | Default   | Description                                                         |
|---------------------------------|---------|-----------|---------------------------------------------------------------------|
| `albus.llama.cpp.host`          | string  | localhost | Host of the LLama model server                                   |
| `albus.llama.cpp.port`          | number  | 8000      | Port of the LLama model server                                   |
| `albus.llama.cpp.stream`        | boolean | true      | Streaming (enabled by default)                                   |
| `albus.llama.cpp.temperature`   | number  | 0.7       | The randomness of the generated text (default: 0.7)              |
| `albus.llama.cpp.max_tokens`    | number  | 20        | The number of tokens to predict when generating text (default: 20)|
| `albus.llama.cpp.repeat_penalty`| number  | 1.1       | The penalty for repeating tokens (default: 1.1)                 |
| `albus.llama.cpp.seed`          | number  | -1        | Seed for the random number generator (default: -1)               |
| `albus.llama.cpp.top_p`         | number  | 0.9       | Limit the next token selection to a subset of tokens with a cumulative probability above a threshold P (default: 0.9)|
| `albus.llama.cpp.top_k`         | number  | 40        | Limit the next token selection to the K most probable tokens (default: 40)|
| `albus.llama.cpp.stop_strings`  | array   | ["### "]  | List of strings for stopping the output of the LLama model        |

## Features

  ✅ Autocompletion  (duh)

  ✅ Configuration of llama.cpp parameters

### Upcoming 

- Integrate other local servers such as Ollama, Koboldcpp, etc.

- Selecting and refactoring code

- Code selection and automatic documentation

- Optimization of selected code

- RAG over code and Chat
