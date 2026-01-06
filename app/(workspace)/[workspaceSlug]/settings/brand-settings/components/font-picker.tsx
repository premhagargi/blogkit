import {
  Category,
  Font,
  FONT_FAMILY_DEFAULT,
  FontManager,
  Options,
  OPTIONS_DEFAULTS,
  Script,
  SortOption,
  Variant,
} from "@samuelmeuli/font-manager";
import React, { KeyboardEvent, PureComponent, ReactElement } from "react";
import FontSearchModal from "./font-search-modal";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";

type LoadingStatus = "loading" | "finished" | "error";

interface Props {
  // Required props
  apiKey: string;

  // Optional props
  activeFontFamily: string;
  onChange: (font: Font) => void;
  pickerId: string;
  families: string[];
  categories: Category[];
  scripts: Script[];
  variants: Variant[];
  filter: (font: Font) => boolean;
  limit: number;
  sort: SortOption;
}

interface State {
  expanded: boolean;
  loadingStatus: LoadingStatus;
}

/**
 * Return the fontId based on the provided font family
 */
function getFontId(fontFamily: string): string {
  return fontFamily.replace(/\s+/g, "-").toLowerCase();
}

export default class FontPicker extends PureComponent<Props, State> {
  // Instance of the FontManager class used for managing, downloading and applying fonts
  fontManager: FontManager;

  static defaultProps = {
    activeFontFamily: FONT_FAMILY_DEFAULT,
    onChange: (): void => {},
    pickerId: OPTIONS_DEFAULTS.pickerId,
    families: OPTIONS_DEFAULTS.families,
    categories: OPTIONS_DEFAULTS.categories,
    scripts: OPTIONS_DEFAULTS.scripts,
    variants: OPTIONS_DEFAULTS.variants,
    filter: OPTIONS_DEFAULTS.filter,
    limit: OPTIONS_DEFAULTS.limit,
    sort: OPTIONS_DEFAULTS.sort,
  };

  state: Readonly<State> = {
    expanded: false,
    loadingStatus: "loading",
  };

  constructor(props: Props) {
    super(props);

    const {
      apiKey,
      activeFontFamily,
      pickerId,
      families,
      categories,
      scripts,
      variants,
      filter,
      limit,
      sort,
      onChange,
    } = this.props;

    const options: Options = {
      pickerId,
      families,
      categories,
      scripts,
      variants,
      filter,
      limit,
      sort,
    };

    // Initialize FontManager object
    this.fontManager = new FontManager(
      apiKey,
      activeFontFamily,
      options,
      onChange
    );
  }

  componentDidMount = (): void => {
    // Generate font list
    this.fontManager
      .init()
      .then((): void => {
        this.setState({
          loadingStatus: "finished",
        });
      })
      .catch((err: Error): void => {
        // On error: Log error message
        this.setState({
          loadingStatus: "error",
        });
        console.error("Error trying to fetch the list of available fonts");
        console.error(err);
      });
  };

  /**
   * After every component update, check whether the activeFontFamily prop has changed. If so,
   * call this.setActiveFontFamily with the new font
   */
  componentDidUpdate = (prevProps: Props): void => {
    const { activeFontFamily, onChange } = this.props;

    // If active font prop has changed: Update font family in font manager and component state
    if (activeFontFamily !== prevProps.activeFontFamily) {
      this.setActiveFontFamily(activeFontFamily);
    }

    // If onChange prop has changed: Update onChange function in font manager
    if (onChange !== prevProps.onChange) {
      this.fontManager.setOnChange(onChange);
    }
  };

  toggleModal = (): void => {
    this.setState((prev) => ({ expanded: !prev.expanded }));
  };

  /**
   * EventListener for closing the font picker when clicking anywhere outside it
   */
  onClose = (e: MouseEvent): void => {
    let targetEl = e.target as Node; // Clicked element
    const fontPickerEl = document.getElementById(
      `font-picker${this.fontManager.selectorSuffix}`
    );

    while (true) {
      if (targetEl === fontPickerEl) {
        // Click inside font picker: Exit
        return;
      }
      if (targetEl.parentNode) {
        // Click outside font picker: Move up the DOM
        targetEl = targetEl.parentNode;
      } else {
        // DOM root is reached: Toggle picker, exit
        this.toggleExpanded();
        return;
      }
    }
  };

  /**
   * Update the active font on font button click
   */
  onSelection = (e: React.MouseEvent | KeyboardEvent): void => {
    const target = e.target as HTMLButtonElement;
    const activeFontFamily = target.textContent;
    if (!activeFontFamily) {
      throw Error(`Missing font family in clicked font button`);
    }
    this.setActiveFontFamily(activeFontFamily);
    this.toggleExpanded();
  };

  /**
   * Set the specified font as the active font in the fontManager and update activeFontFamily in the
   * state
   */
  setActiveFontFamily = (activeFontFamily: string): void => {
    this.fontManager.setActiveFont(activeFontFamily);
  };

  /**
   * Generate <ul> with all font families
   */
  generateFontList = (fonts: Font[]): ReactElement => {
    const { activeFontFamily } = this.props;
    const { loadingStatus } = this.state;

    if (loadingStatus !== "finished") {
      return <div />;
    }
    return (
      <ul className="font-list">
        {fonts.map((font): ReactElement => {
          const isActive = font.family === activeFontFamily;
          const fontId = getFontId(font.family);
          return (
            <li key={fontId} className="font-list-item">
              <button
                type="button"
                id={`font-button-${fontId}${this.fontManager.selectorSuffix}`}
                className={`font-button ${isActive ? "active-font" : ""}`}
                onClick={this.onSelection}
                onKeyPress={this.onSelection}
              >
                {font.family}
              </button>
            </li>
          );
        })}
      </ul>
    );
  };

  /**
   * Expand/collapse the picker's font list
   */
  toggleExpanded = (): void => {
    const { expanded } = this.state;

    if (expanded) {
      this.setState({
        expanded: false,
      });
      document.removeEventListener("click", this.onClose);
    } else {
      this.setState({
        expanded: true,
      });
      document.addEventListener("click", this.onClose);
    }
  };

  onFontSelect = (font: Font): void => {
    this.setActiveFontFamily(font.family);
    this.toggleModal();
  };

  render() {
    const { activeFontFamily, sort } = this.props;
    const { expanded, loadingStatus } = this.state;

    const fonts = Array.from(this.fontManager.getFonts().values());
    if (sort === "alphabet")
      fonts.sort((a, b) => a.family.localeCompare(b.family));

    return (
      <div className="relative w-[150px]">
        {/* Input for displaying the active font */}
        <div className="relative w-full">
          <Input
            readOnly
            value={activeFontFamily}
            placeholder="Select font"
            onClick={this.toggleModal}
            className="cursor-pointer pr-8"
          />
          <ChevronDown
            className={`absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>

        {/* FontSearchModal with a new transition wrapper */}
        <div
          className={`absolute z-10 mt-2 w-full transition-all duration-200 ease-in-out ${
            expanded
              ? "translate-y-0 opacity-100"
              : "-translate-y-2 opacity-0 pointer-events-none"
          }`}
        >
          {loadingStatus === "finished" && (
            <FontSearchModal
              fonts={fonts}
              activeFontFamily={activeFontFamily}
              onSelect={this.onFontSelect}
              open={expanded}
              setOpen={(val) => this.setState({ expanded: val })}
            />
          )}
        </div>

        {/* Loading / Error states */}
        {loadingStatus === "loading" && <div></div>}
        {loadingStatus === "error" && <div>Failed to load fonts</div>}
      </div>
    );
  }
}
