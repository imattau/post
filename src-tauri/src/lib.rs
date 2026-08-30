use tauri::Manager;
use std::path::Path;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_stronghold::Builder::with_argon2(Path::new("post-salt"))
                .build()
        )
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            #[cfg(desktop)]
            {
                use tauri::tray::TrayIconBuilder;
                use tauri::menu::{Menu, MenuItem};
                use std::panic::{catch_unwind, AssertUnwindSafe};

                let show = MenuItem::with_id(app, "show", "Show Post", true, None::<&str>)?;
                let compose = MenuItem::with_id(app, "compose", "Compose", true, None::<&str>)?;
                let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&show, &compose, &quit])?;

                // libappindicator/libayatana-appindicator isn't present in every Linux
                // environment (e.g. the Flatpak GNOME runtime, or a minimal distro), and
                // tray-icon's Linux backend panics on dlopen failure rather than
                // returning an error. Catch that so a missing tray library degrades to
                // "no tray icon" instead of taking down the whole app.
                let tray_result = catch_unwind(AssertUnwindSafe(|| {
                    TrayIconBuilder::new()
                        .menu(&menu)
                        .show_menu_on_left_click(false)
                        .on_menu_event(|app, event| match event.id.as_ref() {
                            "show" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.unminimize();
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                }
                            }
                            "compose" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    let _ = window.unminimize();
                                    let _ = window.show();
                                    let _ = window.set_focus();
                                    let _ = window.eval("window.location.href = '/mail/inbox?compose=true'");
                                }
                            }
                            "quit" => {
                                app.exit(0);
                            }
                            _ => {}
                        })
                        .build(app)
                }));

                match tray_result {
                    Ok(Ok(_tray)) => {}
                    Ok(Err(err)) => log::warn!("Tray icon unavailable: {err}"),
                    Err(_) => log::warn!(
                        "Tray icon unavailable: the platform's status-notifier library \
                         (libayatana-appindicator3 / libappindicator3) failed to load. \
                         Continuing without a tray icon."
                    ),
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
