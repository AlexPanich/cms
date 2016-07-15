@extends('layouts.dashboard')

@section('title')
    Все тексты
@endsection

@section('content')
    <h3><a href="{{ route('create_text') }}">Создать текст</a></h3>
    <h1>Список текстов</h1>
    <table class="table">
        <thead>
            <th>Алиас</th>
            <th>Название</th>
            <th>Редактировать</th>
            <th>Удалить</th>
        </thead>
        <tbody>
            @foreach($texts as $text)
                <tr>
                    <td>{{ $text->alias }}</td>
                    <td>{{ $text->title }}</td>
                    <td><a href="{{ route('edit_text', $text->id) }}">Редактировать</a></td>
                    <td><a href="{{ route('delete_text', $text->id) }}">Удалить</a></td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endsection