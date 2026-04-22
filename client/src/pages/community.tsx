import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useRoute, useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { 
  MessageSquare, 
  Heart, 
  Eye, 
  Pin, 
  Lock, 
  ArrowLeft, 
  Plus, 
  Users, 
  Send,
  ChevronRight
} from "lucide-react";

interface CommunityBoard {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  accessLevel: string;
  sortOrder: number;
}

interface PostAuthor {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string | null;
}

interface CommunityPost {
  id: number;
  boardId: number;
  authorId: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: PostAuthor;
}

interface PostComment {
  id: number;
  postId: number;
  authorId: string;
  parentId: number | null;
  content: string;
  likeCount: number;
  createdAt: string;
  author: PostAuthor;
}

function BoardsList() {
  const { data: boards, isLoading } = useQuery<CommunityBoard[]>({
    queryKey: ["/api/community/boards"]
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3 mt-2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!boards || boards.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Community Boards Yet</h3>
          <p className="text-muted-foreground">
            Community boards are being set up. Check back soon!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {boards.map((board) => (
        <Link key={board.id} href={`/community/${board.slug}`}>
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{board.name}</CardTitle>
                <Badge variant="secondary" className="capitalize">
                  {board.accessLevel === 'all' ? 'Everyone' : board.accessLevel}
                </Badge>
              </div>
              {board.description && (
                <CardDescription>{board.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function BoardView({ slug }: { slug: string }) {
  const [, navigate] = useLocation();
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  const { data: board, isLoading: boardLoading } = useQuery<CommunityBoard>({
    queryKey: ["/api/community/boards", slug]
  });

  const { data: posts, isLoading: postsLoading } = useQuery<CommunityPost[]>({
    queryKey: ["/api/community/boards", slug, "posts"]
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      return apiRequest("POST", `/api/community/boards/${slug}/posts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/boards", slug, "posts"] });
      setShowNewPost(false);
      setNewPostTitle("");
      setNewPostContent("");
    }
  });

  if (boardLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg"></div>;
  }

  if (!board) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Board not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/community")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{board.name}</h2>
          {board.description && (
            <p className="text-muted-foreground">{board.description}</p>
          )}
        </div>
        <Dialog open={showNewPost} onOpenChange={setShowNewPost}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input
                placeholder="Post title..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
              />
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={6}
              />
              <Button 
                className="w-full" 
                onClick={() => createPostMutation.mutate({ title: newPostTitle, content: newPostContent })}
                disabled={!newPostTitle.trim() || !newPostContent.trim() || createPostMutation.isPending}
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {postsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-6">
                <div className="h-5 bg-muted rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/community/${slug}/post/${post.id}`}>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.isPinned && <Pin className="w-4 h-4 text-primary" />}
                        {post.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                        <h3 className="font-semibold truncate">{post.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {post.author.firstName || post.author.email.split('@')[0]}
                        </span>
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.viewCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {post.likeCount}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.commentCount}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Posts Yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to start a discussion!
            </p>
            <Button onClick={() => setShowNewPost(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PostView({ slug, postId }: { slug: string; postId: string }) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");

  const { data: postData, isLoading } = useQuery<CommunityPost & { comments: PostComment[] }>({
    queryKey: ["/api/community/posts", postId]
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/community/posts/${postId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", postId] });
    }
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/community/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts", postId] });
      setNewComment("");
    }
  });

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-muted rounded-lg"></div>;
  }

  if (!postData) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Post not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/community/${slug}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="text-muted-foreground">Back to board</span>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {postData.isPinned && <Pin className="w-4 h-4 text-primary" />}
            {postData.isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
            <CardTitle>{postData.title}</CardTitle>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="font-medium">
              {postData.author.firstName || postData.author.email.split('@')[0]}
            </span>
            <Badge variant="outline" className="capitalize text-xs">
              {postData.author.role || 'member'}
            </Badge>
            <span>{formatDistanceToNow(new Date(postData.createdAt), { addSuffix: true })}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{postData.content}</p>
          </div>
          
          <Separator className="my-6" />
          
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart className="w-4 h-4 mr-2" />
              {postData.likeCount} likes
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Eye className="w-4 h-4" />
              {postData.viewCount} views
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              {postData.comments?.length || 0} comments
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!postData.isLocked && (
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button 
                size="icon"
                onClick={() => commentMutation.mutate(newComment)}
                disabled={!newComment.trim() || commentMutation.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}

          {postData.isLocked && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Lock className="w-4 h-4" />
              This post is locked. No new comments allowed.
            </div>
          )}

          {postData.comments && postData.comments.length > 0 ? (
            <div className="space-y-4 pt-4">
              {postData.comments.map((comment) => (
                <div key={comment.id} className="border-l-2 border-muted pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.author.firstName || comment.author.email.split('@')[0]}
                    </span>
                    <Badge variant="outline" className="capitalize text-xs">
                      {comment.author.role || 'member'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No comments yet. Be the first to share your thoughts!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CommunityPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [matchBoard, boardParams] = useRoute("/community/:slug");
  const [matchPost, postParams] = useRoute("/community/:slug/post/:postId");
  const [, navigate] = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const slug = postParams?.slug || boardParams?.slug;
  const postId = postParams?.postId;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold cursor-pointer">Motion Code</h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Link href="/community">
                <Button variant="ghost" size="sm" className="bg-accent">Community</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {!slug && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Community</h1>
              <p className="text-muted-foreground">
                Connect with fellow athletes, coaches, and clinicians. Share knowledge and discuss training strategies.
              </p>
            </div>
            <BoardsList />
          </div>
        )}

        {slug && !postId && <BoardView slug={slug} />}
        
        {slug && postId && <PostView slug={slug} postId={postId} />}
      </main>
    </div>
  );
}
