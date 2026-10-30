import SwiftUI
import WebKit

@main
struct YouViewApp: App {
    var body: some Scene { WindowGroup { YouViewContainer().preferredColorScheme(.dark) } }
}
struct YouViewContainer: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.allowsPictureInPictureMediaPlayback = true
        configuration.allowsAirPlayForMediaPlayback = true
        // Preserve normal gesture requirements and YouTube's official embedded player.
        let web = WKWebView(frame: .zero, configuration: configuration)
        web.navigationDelegate = context.coordinator
        web.uiDelegate = context.coordinator
        web.isOpaque = false
        web.backgroundColor = .black
        web.scrollView.backgroundColor = .black
        web.load(URLRequest(url: URL(string: "https://drewrardin12.github.io/YouView/")!))
        return web
    }
    func updateUIView(_ web: WKWebView, context: Context) {}
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard action.targetFrame?.isMainFrame == true else { decisionHandler(.allow); return }
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            if url.scheme == "https", url.host == "drewrardin12.github.io", url.path.hasPrefix("/YouView/") {
                decisionHandler(.allow)
            } else {
                decisionHandler(.cancel)
                if ["https", "http"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }
            }
        }
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if action.targetFrame == nil, let url = action.request.url, ["https", "http"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }
            return nil
        }
    }
}
