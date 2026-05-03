import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { HomePage } from "./pages/HomePage";
import { VideoPage } from "./pages/VideoPage";
import { ChannelPage } from "./pages/ChannelPage";
import { EditChannelPage } from "./pages/EditChannelPage";
import { UploadPage } from "./pages/UploadPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminUserVideosPage } from "./pages/AdminUserVideosPage";
import { NotFound } from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "watch/:videoId", Component: VideoPage },
      { path: "channel/:channelId", Component: ChannelPage },
      { path: "channel/edit", Component: EditChannelPage },
      { path: "upload", Component: UploadPage },
      { path: "admin", Component: AdminPage },
      { path: "admin/user/:userId", Component: AdminUserVideosPage },
      { path: "*", Component: NotFound },
    ],
  },
]);
