// /src/app/api/users/me/route.ts

import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/user';
import Artwork from '@/models/artwork';
import Like from '@/models/like';
import Bookmark from '@/models/bookmark';
import Follow from '@/models/follow';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { bucket } from '@/lib/gcs';
import { cookies } from 'next/headers'; 

async function getUserIdFromToken() {
    const JWT_SECRET = process.env.JWT_SECRET!;
    const tokenCookie = (await cookies()).get('token');
    
    if (!tokenCookie) {
        throw new Error('認証トークンが必要です。');
    }
    
    const token = tokenCookie.value;
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
}

/**
 * ログイン中のユーザー情報を取得するAPI
 */
export async function GET() {
    try {
        const userId = await getUserIdFromToken();
        await dbConnect();

        const user = await User.findById(userId).select('-hashedPassword');
        if (!user) {
            return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
        }
        return NextResponse.json(user);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: '認証エラーです。' }, { status: 401 });
    }
}

/**
 * ログイン中のユーザー情報を更新するAPI
 */
export async function PUT(req: Request) {
    try {
        const userId = await getUserIdFromToken();
        const body = await req.json();
        await dbConnect();

        const updateData: { fullName?: string; hashedPassword?: string; mutedTags?: string[] } = {};
        if (body.fullName) updateData.fullName = body.fullName;
        if (body.password) {
            updateData.hashedPassword = await bcrypt.hash(body.password, 10);
        }
        if (body.mutedTags) updateData.mutedTags = body.mutedTags;

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });
        if (!updatedUser) {
            return NextResponse.json({ error: 'ユーザーが見つかりません。' }, { status: 404 });
        }
        
        return NextResponse.json({ 
            id: updatedUser._id,
            username: updatedUser.username,
            fullName: updatedUser.fullName,
            mutedTags: updatedUser.mutedTags
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'サーバーエラーです。' }, { status: 500 });
    }
}

/**
 * ログイン中のユーザーアカウントを削除するAPI
 */
export async function DELETE() {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = await getUserIdFromToken();
        await dbConnect();
        
        const userArtworks = await Artwork.find({ userId }).session(session);
        const artworkIds = userArtworks.map(artwork => artwork._id);
        const deletePromises = userArtworks.flatMap(artwork => 
            artwork.images.map((image: any) => bucket.file(image.path).delete())
        );
        await Promise.all(deletePromises);
        if (artworkIds.length > 0) {
            await Like.deleteMany({ artworkId: { $in: artworkIds } }).session(session);
            await Bookmark.deleteMany({ artworkId: { $in: artworkIds } }).session(session);
        }
        await Like.deleteMany({ userId }).session(session);
        await Bookmark.deleteMany({ userId }).session(session);
        await Follow.deleteMany({ $or: [{ followerId: userId }, { followingId: userId }] }).session(session);
        await Artwork.deleteMany({ userId }).session(session);
        await User.findByIdAndDelete(userId).session(session);
        
        await session.commitTransaction();
        return NextResponse.json({ message: 'アカウントを削除しました。' });
    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        return NextResponse.json({ error: 'アカウントの削除中にエラーが発生しました。' }, { status: 500 });
    } finally {
        session.endSession();
    }
}