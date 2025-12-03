import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMyArticles, fetchMyComments } from '../api/articles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../utils/format.js';

export default function MyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [postState, setPostState] = useState({ page: 1, totalPages: 1, loading: true, error: '' });
  const [comments, setComments] = useState([]);
  const [commentState, setCommentState] = useState({
    page: 1,
    totalPages: 1,
    loading: true,
    error: ''
  });

  useEffect(() => {
    loadPosts(1);
    loadComments(1);
  }, []);

  const loadPosts = async (page) => {
    setPostState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await fetchMyArticles(page);
      const data = res?.data;
      setPosts(data?.articles ?? []);
      setPostState({
        page: data?.page ?? page,
        totalPages: data?.totalPages ?? 1,
        loading: false,
        error: ''
      });
    } catch (error) {
      setPosts([]);
      setPostState({ page: 1, totalPages: 1, loading: false, error: error?.message || '내 게시글을 불러오지 못했습니다.' });
    }
  };

  const loadComments = async (page) => {
    setCommentState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const res = await fetchMyComments(page);
      const data = res?.data;
      setComments(data?.comments ?? []);
      setCommentState({
        page: data?.page ?? page,
        totalPages: data?.totalPages ?? 1,
        loading: false,
        error: ''
      });
    } catch (error) {
      setComments([]);
      setCommentState({
        page: 1,
        totalPages: 1,
        loading: false,
        error: error?.message || '내 댓글을 불러오지 못했습니다.'
      });
    }
  };

  const goPost = (articleId) => {
    navigate(`/post/${articleId}`);
  };

  return (
    <section className="view mypage-view">
      <div className="mypage-grid">
        <section className="mypage-profile" data-role="mypage-profile">
          <div
            className="mypage-profile__avatar"
            data-role="mypage-avatar"
            style={
              user?.profileImage
                ? { backgroundImage: `url(${user.profileImage})`, backgroundSize: 'cover' }
                : undefined
            }
          >
            {user?.profileImage ? '' : user?.userName?.charAt(0)?.toUpperCase() ?? 'T'}
          </div>
          <div>
            <h2 data-role="mypage-name">{user?.userName ?? 'TrueDev Member'}</h2>
            <p data-role="mypage-email">{user?.email ?? 'user@truedev.com'}</p>
            <p className="mypage-bio" data-role="mypage-bio">
              {user ? `${user.userName}님의 TrueDev 공간` : ''}
            </p>
          </div>
          <div className="mypage-actions">
            <Link to="/profile" className="ghost-button">
              회원정보 수정
            </Link>
            <Link to="/password" className="ghost-button">
              비밀번호 변경
            </Link>
          </div>
        </section>

        <section className="mypage-panel mypage-list" id="mypagePosts">
          <h3>내가 쓴 글</h3>
          <ul data-role="mypage-post-list">
            {postState.loading && <li>불러오는 중입니다...</li>}
            {!postState.loading && postState.error && <li>{postState.error}</li>}
            {!postState.loading && !postState.error && posts.length === 0 && <li>작성한 글이 없습니다.</li>}
            {!postState.loading &&
              !postState.error &&
              posts.map((item) => (
                <li key={item.postId} data-article-id={item.postId} onClick={() => goPost(item.postId)}>
                  <span>{item.title}</span>
                  <em>
                    댓글 {item.commentCount ?? 0} • 좋아요 {item.likeCount ?? 0} •{' '}
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                  </em>
                </li>
              ))}
          </ul>
          <div className="pagination" data-role="mypage-post-pagination">
            <button
              type="button"
              className="ghost-button"
              data-role="mypage-post-prev"
              onClick={() => loadPosts(Math.max(1, postState.page - 1))}
              disabled={postState.page <= 1}
            >
              이전
            </button>
            <span className="pagination__info" data-role="mypage-post-info">
              {postState.page}/{postState.totalPages}
            </span>
            <button
              type="button"
              className="ghost-button"
              data-role="mypage-post-next"
              onClick={() => loadPosts(Math.min(postState.totalPages, postState.page + 1))}
              disabled={postState.page >= postState.totalPages}
            >
              다음
            </button>
          </div>
        </section>

        <section className="mypage-panel mypage-list" id="mypageComments">
          <h3>내가 쓴 댓글</h3>
          <ul data-role="mypage-comment-list">
            {commentState.loading && <li>불러오는 중입니다...</li>}
            {!commentState.loading && commentState.error && <li>{commentState.error}</li>}
            {!commentState.loading && !commentState.error && comments.length === 0 && <li>작성한 댓글이 없습니다.</li>}
            {!commentState.loading &&
              !commentState.error &&
              comments.map((item) => (
                <li key={item.id} data-article-id={item.postId} onClick={() => goPost(item.postId)}>
                  <span>{item.content}</span>
                  <em>
                    게시글 {item.postId} • {formatDate(item.createdAt)}
                  </em>
                </li>
              ))}
          </ul>
          <div className="pagination" data-role="mypage-comment-pagination">
            <button
              type="button"
              className="ghost-button"
              data-role="mypage-comment-prev"
              onClick={() => loadComments(Math.max(1, commentState.page - 1))}
              disabled={commentState.page <= 1}
            >
              이전
            </button>
            <span className="pagination__info" data-role="mypage-comment-info">
              {commentState.page}/{commentState.totalPages}
            </span>
            <button
              type="button"
              className="ghost-button"
              data-role="mypage-comment-next"
              onClick={() => loadComments(Math.min(commentState.totalPages, commentState.page + 1))}
              disabled={commentState.page >= commentState.totalPages}
            >
              다음
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}
