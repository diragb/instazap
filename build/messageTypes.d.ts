export interface REEL_MESSAGE {
    path: string;
    op: string;
    thread_id: string;
    item_id: string;
    user_id: number;
    timestamp: number;
    item_type: string;
    placeholder: {
        is_linked: boolean;
        title: string;
        message: string;
        reason: number;
    };
    client_context: string;
    is_btv_send: boolean;
    is_ae_dual_send: boolean;
    show_forward_attribution: boolean;
    is_shh_mode: boolean;
    is_sent_by_viewer: boolean;
}
export interface CANDIDATE {
    width: number;
    height: number;
    url: string;
    scans_profile: string;
    estimated_scans_sizes?: number[];
}
export interface VIDEO_VERSION {
    type: 101 | 102 | 103;
    width: number;
    height: number;
    url: string;
    id: string;
}
export interface CAROUSEL_MEDIA_ITEM {
    id: string;
    media_type: number;
    image_versions2: {
        candidates: CANDIDATE[];
    };
    original_width: number;
    original_height: number;
    explore_pivot_grid: boolean;
    product_type: 'carousel_item';
    carousel_parent_id: string;
    pk: number;
    featured_products: any[];
    commerciality_status: string;
    sharing_friction_info: {
        should_have_sharing_friction: boolean;
        bloks_app_url: any;
        sharing_friction_payload: any;
    };
    product_suggestions: any[];
}
export interface CAROUSEL_MEDIA_ITEM_IMAGE extends CAROUSEL_MEDIA_ITEM {
    media_type: 1;
}
export interface CAROUSEL_MEDIA_ITEM_VIDEO extends CAROUSEL_MEDIA_ITEM {
    media_type: 2;
    is_dash_eligible: number;
    number_of_qualities: number;
    video_versions: VIDEO_VERSION[][];
    video_duration: number;
    video_dash_manifest: string;
    video_codec: string;
}
export interface MEDIA_SHARE_MESSAGE {
    path: string;
    op: string;
    thread_id: string;
    item_id: string;
    user_id: number;
    timestamp: number;
    item_type: 'media_share';
    media_share: {
        taken_at: number;
        pk: number;
        id: string;
        device_timestamp: number;
        client_cache_key: string;
        filter_type: number;
        caption_is_edited: boolean;
        like_and_view_counts_disabled: boolean;
        is_reshare_of_text_post_app_media_in_ig: boolean;
        deleted_reason: number;
        integrity_review_decision: string;
        has_shared_to_fb: number;
        is_unified_video: boolean;
        should_request_ads: boolean;
        is_visual_reply_commenter_notice_enabled: boolean;
        commerciality_status: string;
        explore_hide_comments: boolean;
        shop_routing_user_id: any;
        can_see_insights_as_brand: boolean;
        is_organic_product_tagging_eligible: boolean;
        has_liked: boolean;
        like_count: number;
        media_type: number;
        code: string;
        can_viewer_reshare: boolean;
        caption: any;
        clips_tab_pinned_user_ids: any[];
        comment_inform_treatment: {
            should_have_inform_treatment: boolean;
            text: string;
            url: any;
            action_type: any;
        };
        sharing_friction_info: {
            should_have_sharing_friction: boolean;
            bloks_app_url: any;
            sharing_friction_payload: any;
        };
        original_media_has_visual_reply_media: boolean;
        can_viewer_save: boolean;
        is_in_profile_grid: boolean;
        profile_grid_control_enabled: boolean;
        featured_products: any[];
        is_comments_gif_composer_enabled: boolean;
        product_suggestions: any[];
        user: {
            has_anonymous_profile_picture: boolean;
            fan_club_info: any[];
            fbid_v2: number;
            transparency_product_enabled: boolean;
            latest_reel_media: number;
            is_favorite: boolean;
            is_unpublished: boolean;
            pk: number;
            pk_id: string;
            username: string;
            full_name: string;
            is_private: false;
            friendship_status: any[];
            profile_pic_id: string;
            profile_pic_url: string;
            account_badges: any[];
            feed_post_reshare_disabled: boolean;
            show_account_transparency_details: boolean;
            third_party_downloads_enabled: number;
        };
        image_versions2: {
            candidates: any[][];
        };
        original_width: number;
        original_height: number;
        product_type: 'carousel_container';
        is_paid_partnership: boolean;
        music_metadata: {
            music_canonical_id: string;
            audio_type: any;
            music_info: any;
            original_sound_info: any;
            pinned_media_ids: any;
        };
        organic_tracking_token: string;
        ig_media_sharing_disabled: boolean;
        is_open_to_public_submission: boolean;
        comment_threading_enabled: boolean;
        max_num_visible_preview_comments: number;
        has_more_comments: boolean;
        comment_count: number;
        can_view_more_preview_comments: boolean;
        hide_view_all_comment_entrypoint: boolean;
        carousel_media_count: number;
        carousel_media: CAROUSEL_MEDIA_ITEM[][];
        carousel_media_ids: number[];
        carousel_media_has_pending_post: boolean;
        has_delayed_metadata: boolean;
        carousel_share_child_media_id: string;
    };
    client_context: string;
    is_btv_send: boolean;
    is_ae_dual_send: boolean;
    show_forward_attribution: boolean;
    is_shh_mode: boolean;
    is_sent_by_viewer: boolean;
}
//# sourceMappingURL=messageTypes.d.ts.map