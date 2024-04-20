import { useState } from "react";

interface Option {
  selected: boolean;
  name: string;
};

function inputFunctionality(channels, options: Option[], setOptions, event) {
  const selectedIndex = options.findIndex(({ selected }) => selected === true);

  if (event.key.indexOf("Arrow") === 0) {
    if (selectedIndex !== -1) {
      options[selectedIndex].selected = false;
    }

    let nextIdx;
    if (event.key === "ArrowDown") {
      nextIdx = selectedIndex + 1;
      if (nextIdx >= options.length) {
        nextIdx = 0;
      }
    }
    else if (event.key === "ArrowUp") {
      nextIdx = selectedIndex - 1;
      if (nextIdx < 0) {
        nextIdx = options.length - 1;
      }
    }

    options[nextIdx].selected = true;
    setOptions([...options]);
    return;
  }

  if (event.target.value.length) {
    const newOptions = channels
      .filter((channel) => channel.indexOf(event.target.value) !== -1)
      .map((name) => ({
        selected: options.find((opt) => opt.name === name)?.selected ?? false,
        name
      }));
    console.log(event.target.value, '->', newOptions);
    setOptions(newOptions);
  }
  else {
    setOptions([]);
  }
}

export default function ({ quickLookupVisible, channels }) {
  const [options, setOptions] = useState<Option[]>([]);
  const channelsList = channels.split(" ");
  return (
    <>
      <div className={(quickLookupVisible ? "block" : "hidden") + " bg-slate-800 absolute top-1 left-1 m-2 p-2 z-50 drop-shadow-lg"}>
        <input type="text" onKeyDown={inputFunctionality.bind(null, channelsList, options, setOptions)}></input>
        <div>
          {options.map((option) =>
            <>
              <div className={option.selected ? "bg-slate-500" : ""}>
                {option.name}
              </div>
            </>)
          }
        </div>
      </div>
    </>
  );
}