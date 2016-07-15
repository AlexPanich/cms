@extends('layouts.dashboard')

@section('title')
    Все галереи
@endsection

@section('content')
    <h3><a href="{{ route('create_gallery') }}">Создать галлерею</a></h3>
    <h1>Список галерей</h1>
    <ul>
        @foreach($galleries as $gallery)
            <li>
                <a href="{{ route('upload_gallery', $gallery->id) }}">{{ $gallery['title'] }}</a>
            </li>
        @endforeach
    </ul>
@endsection