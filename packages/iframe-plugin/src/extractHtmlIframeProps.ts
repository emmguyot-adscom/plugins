import { Dimensions, StyleProp, StyleSheet } from 'react-native';
import {
  constructStyles,
  HtmlAttributesDictionary,
  PassProps
} from 'react-native-render-html';
import extractPrintDimensions from './extractPrintDimensions';
import { HTMLIframeProps } from './HTMLIframe';

function normalizeUri(uri: string): string {
  return uri.startsWith('//') ? `https:${uri}` : uri;
}

/**
 * Extract props for the HTMLIframe component from renderer function arguments.
 * This function is especially usefull for custom iframe renderers.
 *
 * @param htmlAttribs - The HTML node attributes.
 * @param convertedCSSStyles - Converted inline styles.
 * @param passProps - Passed props.
 *
 * @public
 */
export default function extractHtmlIframeProps(
  htmlAttribs: HtmlAttributesDictionary,
  convertedCSSStyles: StyleProp<any>,
  passProps: PassProps<any>
): HTMLIframeProps {
  const {
    WebView,
    contentWidth,
    onLinkPress,
    computeEmbeddedMaxWidth,
    defaultWebViewProps,
    key,
    renderersProps: { iframe: iframeConfig }
  } = passProps;
  const resolvedContentWidth =
    typeof contentWidth === 'number'
      ? contentWidth
      : Dimensions.get('window').width;
  const availableWidth =
    computeEmbeddedMaxWidth?.call(null, resolvedContentWidth, 'iframe') ||
    resolvedContentWidth;
  const { width, height, ...restStyle } = StyleSheet.flatten(
    constructStyles({
      tagName: 'iframe',
      htmlAttribs,
      passProps,
      styleSet: 'VIEW',
      additionalStyles: [convertedCSSStyles],
      baseFontStyle: passProps.baseFontStyle || ({} as any)
    })
  );

  const attrWidth = Number(htmlAttribs.width);
  const attrHeight = Number(htmlAttribs.height);
  const printConfig = {
    attrWidth: Number.isNaN(attrWidth) ? null : attrWidth,
    attrHeight: Number.isNaN(attrHeight) ? null : attrHeight,
    styleWidth: width,
    styleHeight: height,
    contentWidth: availableWidth
  };
  const { printWidth, printHeight } = extractPrintDimensions(printConfig);
  const scaleFactor =
    typeof printConfig.attrWidth === 'number' &&
    printConfig.attrWidth > printWidth
      ? printWidth / attrWidth
      : 1;

  const source = htmlAttribs.srcdoc
    ? { html: htmlAttribs.srcdoc as string }
    : { uri: normalizeUri(htmlAttribs.src as string) };

  if (__DEV__ && !WebView) {
    console.warn(
      "@native-html/iframe-plugin: You must pass a WebView component from react-native-webview as a prop to the HTML component. The iframe won't be rendered."
    );
  }
  return {
    ...iframeConfig,
    key,
    source,
    onLinkPress,
    htmlAttribs,
    scaleFactor,
    style: [restStyle, { width: printWidth, height: printHeight }],
    webViewProps: defaultWebViewProps,
    WebView
  };
}